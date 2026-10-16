-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "currency" VARCHAR(200) NOT NULL,
    "openingBalance" BIGINT NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "kind" VARCHAR(200) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "accountId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "currency" VARCHAR(200) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "budgetId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "limitAmount" BIGINT NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "accountId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "dueDate" DATE NOT NULL,
    "frequency" VARCHAR(200) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "code" VARCHAR(200) NOT NULL,
    "term" VARCHAR(200) NOT NULL,
    "instructor" VARCHAR(200) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "courseId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" VARCHAR(200) NOT NULL,
    "pointsPossible" INTEGER NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "courseId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" VARCHAR(200) NOT NULL,
    "pointsPossible" INTEGER NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "courseId" UUID NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "pointsPossible" INTEGER NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "courseId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "minutes" INTEGER NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "startTime" VARCHAR(200) NOT NULL,
    "endTime" VARCHAR(200) NOT NULL,
    "location" VARCHAR(200) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" VARCHAR(200) NOT NULL,
    "priority" VARCHAR(200) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "taskId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "time" VARCHAR(200) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerApplication" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "company" VARCHAR(200) NOT NULL,
    "status" VARCHAR(200) NOT NULL,
    "date" DATE NOT NULL,
    "url" VARCHAR(200) NOT NULL,

    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "applicationId" UUID NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "organization" VARCHAR(200) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "applicationId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" VARCHAR(200) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(8000) NOT NULL,
    "status" VARCHAR(200) NOT NULL,
    "dueDate" DATE NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "projectId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" VARCHAR(200) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectActivity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "projectId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(8000) NOT NULL,

    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "target" INTEGER NOT NULL,
    "current" INTEGER NOT NULL,
    "unit" VARCHAR(200) NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" VARCHAR(200) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "goalId" UUID NOT NULL,
    "target" INTEGER NOT NULL,
    "unit" VARCHAR(200) NOT NULL,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "habitId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "HabitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" VARCHAR(8000) NOT NULL,
    "tag" VARCHAR(200) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialAccount_userId_updatedAt_idx" ON "FinancialAccount"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_id_userId_key" ON "FinancialAccount"("id", "userId");

-- CreateIndex
CREATE INDEX "Category_userId_updatedAt_idx" ON "Category"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_id_userId_key" ON "Category"("id", "userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_updatedAt_idx" ON "Transaction"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_accountId_idx" ON "Transaction"("userId", "accountId");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_idx" ON "Transaction"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_id_userId_key" ON "Transaction"("id", "userId");

-- CreateIndex
CREATE INDEX "Budget_userId_updatedAt_idx" ON "Budget"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Budget_userId_startDate_idx" ON "Budget"("userId", "startDate");

-- CreateIndex
CREATE INDEX "Budget_userId_endDate_idx" ON "Budget"("userId", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_id_userId_key" ON "Budget"("id", "userId");

-- CreateIndex
CREATE INDEX "BudgetCategory_userId_updatedAt_idx" ON "BudgetCategory"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "BudgetCategory_userId_budgetId_idx" ON "BudgetCategory"("userId", "budgetId");

-- CreateIndex
CREATE INDEX "BudgetCategory_userId_categoryId_idx" ON "BudgetCategory"("userId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_id_userId_key" ON "BudgetCategory"("id", "userId");

-- CreateIndex
CREATE INDEX "RecurringExpense_userId_updatedAt_idx" ON "RecurringExpense"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "RecurringExpense_userId_accountId_idx" ON "RecurringExpense"("userId", "accountId");

-- CreateIndex
CREATE INDEX "RecurringExpense_userId_categoryId_idx" ON "RecurringExpense"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "RecurringExpense_userId_dueDate_idx" ON "RecurringExpense"("userId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringExpense_id_userId_key" ON "RecurringExpense"("id", "userId");

-- CreateIndex
CREATE INDEX "Course_userId_updatedAt_idx" ON "Course"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_id_userId_key" ON "Course"("id", "userId");

-- CreateIndex
CREATE INDEX "Assignment_userId_updatedAt_idx" ON "Assignment"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Assignment_userId_courseId_idx" ON "Assignment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Assignment_userId_dueDate_idx" ON "Assignment"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Assignment_userId_status_idx" ON "Assignment"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_id_userId_key" ON "Assignment"("id", "userId");

-- CreateIndex
CREATE INDEX "Exam_userId_updatedAt_idx" ON "Exam"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Exam_userId_courseId_idx" ON "Exam"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Exam_userId_dueDate_idx" ON "Exam"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Exam_userId_status_idx" ON "Exam"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_id_userId_key" ON "Exam"("id", "userId");

-- CreateIndex
CREATE INDEX "Grade_userId_updatedAt_idx" ON "Grade"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Grade_userId_courseId_idx" ON "Grade"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Grade_userId_date_idx" ON "Grade"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_id_userId_key" ON "Grade"("id", "userId");

-- CreateIndex
CREATE INDEX "StudySession_userId_updatedAt_idx" ON "StudySession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "StudySession_userId_courseId_idx" ON "StudySession"("userId", "courseId");

-- CreateIndex
CREATE INDEX "StudySession_userId_date_idx" ON "StudySession"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StudySession_id_userId_key" ON "StudySession"("id", "userId");

-- CreateIndex
CREATE INDEX "Event_userId_updatedAt_idx" ON "Event"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Event_userId_startDate_idx" ON "Event"("userId", "startDate");

-- CreateIndex
CREATE INDEX "Event_userId_endDate_idx" ON "Event"("userId", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Event_id_userId_key" ON "Event"("id", "userId");

-- CreateIndex
CREATE INDEX "Task_userId_updatedAt_idx" ON "Task"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Task_id_userId_key" ON "Task"("id", "userId");

-- CreateIndex
CREATE INDEX "Reminder_userId_updatedAt_idx" ON "Reminder"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Reminder_userId_taskId_idx" ON "Reminder"("userId", "taskId");

-- CreateIndex
CREATE INDEX "Reminder_userId_dueDate_idx" ON "Reminder"("userId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_id_userId_key" ON "Reminder"("id", "userId");

-- CreateIndex
CREATE INDEX "CareerApplication_userId_updatedAt_idx" ON "CareerApplication"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CareerApplication_userId_status_idx" ON "CareerApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "CareerApplication_userId_date_idx" ON "CareerApplication"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplication_id_userId_key" ON "CareerApplication"("id", "userId");

-- CreateIndex
CREATE INDEX "Contact_userId_updatedAt_idx" ON "Contact"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Contact_userId_applicationId_idx" ON "Contact"("userId", "applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_id_userId_key" ON "Contact"("id", "userId");

-- CreateIndex
CREATE INDEX "FollowUp_userId_updatedAt_idx" ON "FollowUp"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "FollowUp_userId_applicationId_idx" ON "FollowUp"("userId", "applicationId");

-- CreateIndex
CREATE INDEX "FollowUp_userId_dueDate_idx" ON "FollowUp"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "FollowUp_userId_status_idx" ON "FollowUp"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUp_id_userId_key" ON "FollowUp"("id", "userId");

-- CreateIndex
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", "status");

-- CreateIndex
CREATE INDEX "Project_userId_dueDate_idx" ON "Project"("userId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_userId_key" ON "Project"("id", "userId");

-- CreateIndex
CREATE INDEX "Milestone_userId_updatedAt_idx" ON "Milestone"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Milestone_userId_projectId_idx" ON "Milestone"("userId", "projectId");

-- CreateIndex
CREATE INDEX "Milestone_userId_dueDate_idx" ON "Milestone"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Milestone_userId_status_idx" ON "Milestone"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_id_userId_key" ON "Milestone"("id", "userId");

-- CreateIndex
CREATE INDEX "ProjectActivity_userId_updatedAt_idx" ON "ProjectActivity"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ProjectActivity_userId_projectId_idx" ON "ProjectActivity"("userId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectActivity_userId_date_idx" ON "ProjectActivity"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectActivity_id_userId_key" ON "ProjectActivity"("id", "userId");

-- CreateIndex
CREATE INDEX "Goal_userId_updatedAt_idx" ON "Goal"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Goal_userId_dueDate_idx" ON "Goal"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Goal_userId_status_idx" ON "Goal"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_id_userId_key" ON "Goal"("id", "userId");

-- CreateIndex
CREATE INDEX "Habit_userId_updatedAt_idx" ON "Habit"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Habit_userId_goalId_idx" ON "Habit"("userId", "goalId");

-- CreateIndex
CREATE UNIQUE INDEX "Habit_id_userId_key" ON "Habit"("id", "userId");

-- CreateIndex
CREATE INDEX "HabitEntry_userId_updatedAt_idx" ON "HabitEntry"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "HabitEntry_userId_habitId_idx" ON "HabitEntry"("userId", "habitId");

-- CreateIndex
CREATE INDEX "HabitEntry_userId_date_idx" ON "HabitEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HabitEntry_id_userId_key" ON "HabitEntry"("id", "userId");

-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Note_id_userId_key" ON "Note"("id", "userId");

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "FinancialAccount"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_userId_fkey" FOREIGN KEY ("categoryId", "userId") REFERENCES "Category"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetId_userId_fkey" FOREIGN KEY ("budgetId", "userId") REFERENCES "Budget"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_categoryId_userId_fkey" FOREIGN KEY ("categoryId", "userId") REFERENCES "Category"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "FinancialAccount"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_categoryId_userId_fkey" FOREIGN KEY ("categoryId", "userId") REFERENCES "Category"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_userId_fkey" FOREIGN KEY ("courseId", "userId") REFERENCES "Course"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseId_userId_fkey" FOREIGN KEY ("courseId", "userId") REFERENCES "Course"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_courseId_userId_fkey" FOREIGN KEY ("courseId", "userId") REFERENCES "Course"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_courseId_userId_fkey" FOREIGN KEY ("courseId", "userId") REFERENCES "Course"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_taskId_userId_fkey" FOREIGN KEY ("taskId", "userId") REFERENCES "Task"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_applicationId_userId_fkey" FOREIGN KEY ("applicationId", "userId") REFERENCES "CareerApplication"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_applicationId_userId_fkey" FOREIGN KEY ("applicationId", "userId") REFERENCES "CareerApplication"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_userId_fkey" FOREIGN KEY ("projectId", "userId") REFERENCES "Project"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_userId_fkey" FOREIGN KEY ("projectId", "userId") REFERENCES "Project"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_goalId_userId_fkey" FOREIGN KEY ("goalId", "userId") REFERENCES "Goal"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HabitEntry" ADD CONSTRAINT "HabitEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitEntry" ADD CONSTRAINT "HabitEntry_habitId_userId_fkey" FOREIGN KEY ("habitId", "userId") REFERENCES "Habit"("id", "userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "FinancialAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialAccount" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "FinancialAccount" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "FinancialAccount" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_currency_valid" CHECK ("currency" IN ('USD','CAD','EUR','GBP'));
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_openingBalance_valid" CHECK ("openingBalance" BETWEEN -99999999999999 AND 99999999999999);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Category" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Category" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Category" ADD CONSTRAINT "Category_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Category" ADD CONSTRAINT "Category_kind_valid" CHECK ("kind" IN ('expense','income'));

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Transaction" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Transaction" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_amount_valid" CHECK ("amount" BETWEEN 0 AND 99999999999999);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Budget" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Budget" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_currency_valid" CHECK ("currency" IN ('USD','CAD','EUR','GBP'));
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_date_order" CHECK ("endDate" >= "startDate");

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "BudgetCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BudgetCategory" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "BudgetCategory" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "BudgetCategory" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_limitAmount_valid" CHECK ("limitAmount" BETWEEN 0 AND 99999999999999);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "RecurringExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecurringExpense" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "RecurringExpense" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "RecurringExpense" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_amount_valid" CHECK ("amount" BETWEEN 0 AND 99999999999999);
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_frequency_valid" CHECK ("frequency" IN ('weekly','monthly','yearly'));

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Course" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Course" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Course" ADD CONSTRAINT "Course_title_valid" CHECK (length(trim("title")) > 0);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Assignment" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Assignment" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_status_valid" CHECK ("status" IN ('planned','active','done'));
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_pointsPossible_valid" CHECK ("pointsPossible" BETWEEN 0 AND 1000000);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Exam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exam" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Exam" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Exam" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_status_valid" CHECK ("status" IN ('planned','active','done'));
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_pointsPossible_valid" CHECK ("pointsPossible" BETWEEN 0 AND 1000000);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Grade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Grade" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Grade" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Grade" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_pointsEarned_valid" CHECK ("pointsEarned" BETWEEN 0 AND 1000000);
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_pointsPossible_valid" CHECK ("pointsPossible" BETWEEN 1 AND 1000000);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "StudySession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudySession" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "StudySession" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "StudySession" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_minutes_valid" CHECK ("minutes" BETWEEN 0 AND 1440);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Event" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Event" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Event" ADD CONSTRAINT "Event_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Event" ADD CONSTRAINT "Event_startTime_valid" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "Event" ADD CONSTRAINT "Event_endTime_valid" CHECK ("endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "Event" ADD CONSTRAINT "Event_date_order" CHECK ("endDate" >= "startDate");
ALTER TABLE "Event" ADD CONSTRAINT "Event_time_order" CHECK ("endDate" > "startDate" OR "endTime" >= "startTime");

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Task" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Task" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Task" ADD CONSTRAINT "Task_status_valid" CHECK ("status" IN ('planned','active','done'));
ALTER TABLE "Task" ADD CONSTRAINT "Task_priority_valid" CHECK ("priority" IN ('normal','high','low'));

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reminder" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Reminder" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Reminder" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_time_valid" CHECK ("time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "CareerApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CareerApplication" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "CareerApplication" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "CareerApplication" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_status_valid" CHECK ("status" IN ('saved','applied','interview','offer','rejected','withdrawn'));

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Contact" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Contact" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_title_valid" CHECK (length(trim("title")) > 0);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "FollowUp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FollowUp" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "FollowUp" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "FollowUp" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_status_valid" CHECK ("status" IN ('planned','active','done'));

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Project" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Project" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Project" ADD CONSTRAINT "Project_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Project" ADD CONSTRAINT "Project_status_valid" CHECK ("status" IN ('planned','active','done'));

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Milestone" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Milestone" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_status_valid" CHECK ("status" IN ('planned','active','done'));

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "ProjectActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectActivity" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "ProjectActivity" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "ProjectActivity" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_title_valid" CHECK (length(trim("title")) > 0);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Goal" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Goal" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_target_valid" CHECK ("target" BETWEEN 1 AND 1000000);
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_current_valid" CHECK ("current" BETWEEN 0 AND 1000000);
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_status_valid" CHECK ("status" IN ('planned','active','done'));

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Habit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Habit" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Habit" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Habit" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_target_valid" CHECK ("target" BETWEEN 1 AND 1000000);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "HabitEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HabitEntry" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "HabitEntry" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "HabitEntry" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "HabitEntry" ADD CONSTRAINT "HabitEntry_title_valid" CHECK (length(trim("title")) > 0);
ALTER TABLE "HabitEntry" ADD CONSTRAINT "HabitEntry_value_valid" CHECK ("value" BETWEEN 0 AND 1000000);

-- Owner-scoped tracking, independently enforced by PostgreSQL.
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Note" FROM anon, authenticated;
CREATE POLICY tracking_owner ON "Note" FOR ALL USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
ALTER TABLE "Note" ADD CONSTRAINT "Note_title_valid" CHECK (length(trim("title")) > 0);

CREATE POLICY tracking_audit_insert ON "AuditLog" FOR INSERT WITH CHECK ((SELECT auth.uid()) = "userId" AND action LIKE 'tracking.%' AND outcome = 'success');

CREATE UNIQUE INDEX "BudgetCategory_userId_budgetId_categoryId_key" ON "BudgetCategory" ("userId","budgetId","categoryId");
CREATE UNIQUE INDEX "HabitEntry_userId_habitId_date_key" ON "HabitEntry" ("userId","habitId","date");
