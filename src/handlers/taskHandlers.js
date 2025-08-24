const TaskService = require('../services/TaskService');
const NaturalLanguageParser = require('../utils/NaturalLanguageParser');
const SlackFormatter = require('../utils/SlackFormatter');

/**
 * Setup all Slack event handlers for the todo bot
 */
function setupTaskHandlers(app) {
  // Handle direct messages to the bot
  app.message(async ({ message, say, client }) => {
    try {
      await handleMessage(message, say, client, false);
    } catch (error) {
      console.error('Error handling DM:', error);
      await say(SlackFormatter.formatError(error, 'processing your message'));
    }
  });
  
  // Handle mentions of the bot in channels
  app.event('app_mention', async ({ event, say, client }) => {
    try {
      // Remove the bot mention from the message
      const cleanMessage = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
      const fakeMessage = { ...event, text: cleanMessage };
      await handleMessage(fakeMessage, say, client, true);
    } catch (error) {
      console.error('Error handling mention:', error);
      await say(SlackFormatter.formatError(error, 'processing your message'));
    }
  });
  
  // Handle slash commands (optional enhancement)
  app.command('/todo', async ({ command, ack, say, client }) => {
    await ack();
    
    try {
      const fakeMessage = {
        user: command.user_id,
        text: command.text,
        team: command.team_id,
        channel: command.channel_id
      };
      
      await handleMessage(fakeMessage, say, client, false);
    } catch (error) {
      console.error('Error handling slash command:', error);
      await say(SlackFormatter.formatError(error, 'processing your command'));
    }
  });
  
  // Handle interactive button clicks (for future enhancements)
  app.action('task_action', async ({ body, ack, say, client }) => {
    await ack();
    
    try {
      const action = body.actions[0];
      const taskId = action.value;
      const userId = body.user.id;
      const teamId = body.team.id;
      
      switch (action.action_id) {
        case 'complete_task':
          const completedTask = await TaskService.completeTask(taskId, userId, teamId);
          await say(SlackFormatter.formatTaskCompleted(completedTask));
          break;
          
        case 'snooze_task':
          const { task, snoozeUntil } = await TaskService.snoozeTask(taskId, '+1h', userId, teamId);
          await say(SlackFormatter.formatTaskSnoozed(task, snoozeUntil));
          break;
      }
      
    } catch (error) {
      console.error('Error handling button action:', error);
      await say(SlackFormatter.formatError(error, 'processing your action'));
    }
  });
  
  console.log('✅ Task handlers registered successfully');
}

/**
 * Main message handler that routes to appropriate actions
 */
async function handleMessage(message, say, client, isMention = false) {
  const userId = message.user;
  const teamId = message.team;
  const channelId = message.channel;
  const text = message.text?.trim();
  
  if (!text || text.length === 0) {
    return; // Ignore empty messages
  }
  
  // Get user info
  const userInfo = await getUserInfo(userId, client);
  const user = {
    userId: userId,
    username: userInfo.name || userId,
    displayName: userInfo.profile?.display_name,
    realName: userInfo.real_name,
    teamId: teamId
  };
  
  // Parse the command
  const managementCommand = NaturalLanguageParser.parseManagementCommand(text);
  
  if (managementCommand) {
    // Handle management commands
    await handleManagementCommand(managementCommand, user, teamId, say, client);
  } else if (NaturalLanguageParser.isTaskCreation(text)) {
    // Handle task creation
    await handleTaskCreation(text, user, teamId, channelId, say, client);
  } else if (isMention) {
    // If mentioned but no valid command, show help
    await say(SlackFormatter.formatHelp());
  }
  // Ignore other messages in channels to avoid spam
}

/**
 * Handle task management commands (list, done, snooze, etc.)
 */
async function handleManagementCommand(command, user, teamId, say, client) {
  try {
    switch (command.action) {
      case 'list':
        await handleListCommand(command, user, teamId, say);
        break;
        
      case 'complete':
        await handleCompleteCommand(command, user, teamId, say);
        break;
        
      case 'snooze':
        await handleSnoozeCommand(command, user, teamId, say);
        break;
        
      case 'delete':
        await handleDeleteCommand(command, user, teamId, say);
        break;
        
      case 'show':
        await handleShowCommand(command, user, teamId, say);
        break;
        
      case 'help':
        await say(SlackFormatter.formatHelp());
        break;
        
      default:
        await say('Command not recognized. Type `help` for available commands.');
    }
    
  } catch (error) {
    throw error;
  }
}

/**
 * Handle task creation from natural language
 */
async function handleTaskCreation(text, user, teamId, channelId, say, client) {
  try {
    const task = await TaskService.createTask(text, user, teamId, channelId, client);
    await say(SlackFormatter.formatTaskCreated(task));
    
    // If assigned to someone else, send them a notification
    if (task.assignedTo?.userId && task.assignedTo.userId !== user.userId) {
      try {
        await client.chat.postMessage({
          channel: task.assignedTo.userId,
          text: `🔔 You've been assigned a new task by @${user.username}:\n\n${SlackFormatter.formatTask(task, true)}`,
          unfurl_links: false
        });
      } catch (dmError) {
        console.warn('Could not send DM to assignee:', dmError.message);
      }
    }
    
  } catch (error) {
    throw error;
  }
}

/**
 * Handle list command
 */
async function handleListCommand(command, user, teamId, say) {
  try {
    const options = {
      status: command.status === 'all' ? undefined : command.status,
      limit: 50
    };
    
    if (command.status === 'overdue') {
      options.dueBefore = Math.floor(Date.now() / 1000);
      options.status = undefined; // Don't filter by status for overdue
    }
    
    const tasks = await TaskService.listTasks(user.userId, teamId, options);
    
    let title = 'Your Tasks';
    if (command.status === 'completed') {
      title = 'Your Completed Tasks';
    } else if (command.status === 'overdue') {
      title = 'Your Overdue Tasks';
    } else if (command.status === 'all') {
      title = 'All Your Tasks';
    } else {
      title = 'Your Pending Tasks';
    }
    
    const formatted = SlackFormatter.formatTaskList(tasks, title);
    await say(formatted);
    
  } catch (error) {
    throw error;
  }
}

/**
 * Handle complete command
 */
async function handleCompleteCommand(command, user, teamId, say) {
  try {
    const task = await TaskService.completeTask(command.taskId, user.userId, teamId);
    await say(SlackFormatter.formatTaskCompleted(task));
    
  } catch (error) {
    throw error;
  }
}

/**
 * Handle snooze command
 */
async function handleSnoozeCommand(command, user, teamId, say) {
  try {
    const { task, snoozeUntil } = await TaskService.snoozeTask(
      command.taskId, 
      command.snoozeUntil, 
      user.userId, 
      teamId
    );
    
    await say(SlackFormatter.formatTaskSnoozed(task, snoozeUntil));
    
  } catch (error) {
    throw error;
  }
}

/**
 * Handle delete command
 */
async function handleDeleteCommand(command, user, teamId, say) {
  try {
    const task = await TaskService.deleteTask(command.taskId, user.userId, teamId);
    await say(`🗑️ *Task deleted*\n\n~~${task.title}~~`);
    
  } catch (error) {
    throw error;
  }
}

/**
 * Handle show command
 */
async function handleShowCommand(command, user, teamId, say) {
  try {
    const task = await TaskService.showTask(command.taskId, user.userId, teamId);
    
    const formatted = `*Task Details*\n\n${SlackFormatter.formatTask(task, true)}`;
    await say(formatted);
    
  } catch (error) {
    throw error;
  }
}

/**
 * Get user information from Slack
 */
async function getUserInfo(userId, client) {
  try {
    const result = await client.users.info({ user: userId });
    return result.user;
  } catch (error) {
    console.warn('Could not fetch user info:', error.message);
    return { name: userId }; // Fallback
  }
}

module.exports = {
  setupTaskHandlers
};