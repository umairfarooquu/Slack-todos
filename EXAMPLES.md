# 📚 Slack Todo Bot - Usage Examples

This document shows real-world examples of how to use the Slack Todo Bot effectively.

## 🎯 Basic Task Creation

### Simple Tasks

```
Buy groceries
Call John about the project
Review quarterly report
```

### Tasks with Assignments

```
Review PR #123 @sarah
Send invoice to client @alice
Update documentation @bob
```

### Tasks with Tags and Categories

```
Fix login bug #backend #urgent
Plan team meeting #management #weekly
Order office supplies #admin #low-priority
```

### Tasks with Due Dates

```
Submit expense report tomorrow
Review contracts by friday 5pm
Call client next week
Prepare presentation by end of week
```

### Complex Tasks (Everything Combined)

```
Review security audit @alice #security #urgent tomorrow 2pm
Plan holiday party @hr-team #events #fun next month
Update server configs @devops #infrastructure #maintenance friday
```

## ⚡ Natural Language Examples

### Time Expressions

```
# Relative time
Pay bills +2h
Call mom in 30 minutes
Review docs +1d

# Natural language
Submit report tomorrow
Meeting with client next week
Deadline is friday afternoon
Complete by end of month

# Specific times
Call vendor 2pm
Team standup 9:30am tomorrow
Presentation thursday 3pm
```

### Priority Levels

```
# Urgent tasks
Fix server issue URGENT
Security patch ASAP!!
Critical bug needs attention immediately

# Important tasks
Review important contract
High priority client call
This is important - handle soon

# Low priority tasks
Clean desk when you have time
Low priority - maybe next week
Optional: organize files
```

### Assignment Patterns

```
# Direct assignment
@john please review this document
Handle customer complaint @support-team
@alice can you check the database?

# Multiple mentions (first one gets assigned)
@john @alice review code (assigns to john)
Meeting with @client and @manager (assigns to client)
```

## 📋 Task Management Commands

### Listing Tasks

```
# Basic listing
list
show tasks
my tasks

# Filter by status
list pending
list completed
list all
list overdue

# In channels (mention bot)
@todo list
@todo show my overdue tasks
```

### Completing Tasks

```
# Using task ID (first 8 characters)
done a1b2c3d4
complete a1b2c3d4
finished a1b2c3d4

# Alternative formats
mark a1b2c3d4 complete
task a1b2c3d4 done
```

### Snoozing Tasks

```
# Relative snooze
snooze a1b2c3d4 +2h
snooze a1b2c3d4 +30m
snooze a1b2c3d4 +1d

# Natural language snooze
snooze a1b2c3d4 tomorrow 9am
snooze a1b2c3d4 next week
snooze a1b2c3d4 friday afternoon

# Specific times
snooze a1b2c3d4 2024-12-25 10am
snooze a1b2c3d4 monday 2pm
```

### Task Details and Deletion

```
# Show task details
show a1b2c3d4
task a1b2c3d4
details a1b2c3d4

# Delete tasks (only creator can delete)
delete a1b2c3d4
remove a1b2c3d4
cancel a1b2c3d4
```

## 👥 Team Collaboration Examples

### Project Management

```
# Sprint planning
@sarah Review user stories #sprint-1 by friday
@dev-team Fix critical bugs #bug-fixes urgent
@qa-team Test new features #testing next week

# Code reviews
@alice Review PR #456 #code-review tomorrow
@bob Merge feature branch #deployment friday 5pm
@team Code freeze starts monday #release
```

### Meeting Organization

```
# Meeting prep
@everyone Prepare agenda items #weekly-meeting tomorrow 9am
@john Book conference room #logistics urgent
@sarah Send calendar invites #coordination today

# Follow-ups
@team Review meeting notes #follow-up by wednesday
@alice Send action items #tasks to all attendees
@manager Approve budget #approval before friday
```

### Customer Support

```
# Ticket assignment
@support Handle ticket #1234 #customer-issue urgent
@alice Follow up with client #support by end of day
@team Update knowledge base #documentation low priority

# Escalation
@manager Client complaint needs attention #escalation ASAP
@senior-dev Complex bug reported #technical urgent
@support-lead Review support metrics #analytics weekly
```

## 📅 Daily Workflow Examples

### Morning Routine

```
# Check tasks for today
list
list overdue

# Plan new tasks
Review emails #admin 30 minutes
Client calls #sales 10am-12pm
Finish report #work by 5pm
```

### Task Updates Throughout Day

```
# Mark progress
done a1b2c3d4
snooze b2c3d4e5 +1h

# Add new urgent tasks
Fix production issue #critical URGENT
@dev-team Server down #emergency NOW
```

### End of Day Review

```
# Check what's pending
list pending
list overdue

# Reschedule if needed
snooze c3d4e5f6 tomorrow 9am
snooze d4e5f6g7 next week
```

## 🏢 Organization Patterns

### Tag Categories

```
# By department
#engineering #marketing #sales #hr #finance #admin

# By type
#bug #feature #meeting #documentation #testing #deployment

# By priority
#urgent #important #routine #optional

# By project
#project-alpha #sprint-2 #q4-goals #client-work
```

### Assignment Strategies

```
# By role
@frontend-dev @backend-dev @designer @pm @qa

# By expertise
@database-expert @security-specialist @ui-expert

# By availability
@oncall-dev @available-today @part-time-team
```

### Time Management

```
# Time-blocking
Review code 9-11am tomorrow
Client calls 2-4pm friday
Focus time +2h no interruptions

# Batch processing
Process emails 30 minutes daily
Review PRs fridays 1pm
Weekly planning mondays 9am
```

## 🎨 Advanced Usage Patterns

### Recurring Tasks

```
# Weekly tasks
Weekly team standup #meeting mondays 9am
Review metrics #analytics friday 3pm
Submit timesheet #admin fridays

# Monthly tasks
Monthly report #reporting last friday
Team retrospective #improvement monthly
Equipment check #maintenance monthly
```

### Project Tracking

```
# Milestone management
Complete Phase 1 #project-x by march 15
@team Deliver MVP #milestone april 1
Review Phase 2 scope #planning next month

# Dependency tracking
@alice Finish API before @bob starts frontend
Database migration before app deployment
Testing after feature completion
```

### Notification Management

```
# Urgent notifications
Server monitoring alert #ops IMMEDIATE
Security incident response #security URGENT
Customer escalation #support high priority

# Scheduled reminders
Backup database #maintenance every sunday 2am
Send weekly report #reporting fridays 4pm
Check system health #monitoring daily 9am
```

## ❗ Common Mistakes to Avoid

### ❌ Poor Task Descriptions

```
# Too vague
"Do stuff"
"Handle it"
"Fix the thing"

# Better ✅
"Review Q4 budget spreadsheet"
"Fix login timeout issue in mobile app"
"Respond to client email about project timeline"
```

### ❌ Missing Context

```
# No deadline
"Call John"

# Better ✅
"Call John about contract renewal by friday 2pm"
```

### ❌ Wrong Assignments

```
# Non-existent user
"Review docs @johnn" (typo)

# Better ✅
"Review docs @john" (correct username)
```

### ❌ Unclear Priorities

```
# Ambiguous
"Important stuff"

# Better ✅
"Review security patch #critical urgent"
"Update docs #routine low priority"
```

## 💡 Pro Tips

### 1. Use Consistent Naming

- Establish team conventions for tags
- Use consistent @username formats
- Standardize priority keywords

### 2. Batch Operations

- Create multiple related tasks quickly
- Use similar tags for easy filtering
- Group by assignee or deadline

### 3. Regular Maintenance

- Review overdue tasks weekly
- Clean up completed tasks
- Update assignments as team changes

### 4. Integration Workflows

- Use bot reminders for recurring meetings
- Link tasks to GitHub issues/PRs
- Coordinate with calendar events

---

🚀 **Master these patterns and your team's productivity will skyrocket!**

For more information, check the [README.md](README.md) and [SETUP.md](SETUP.md) files.
