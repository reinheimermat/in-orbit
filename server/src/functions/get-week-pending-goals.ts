import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { db } from '../db'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { goalCompletions, goals } from '../db/schema'

dayjs.extend(weekOfYear)

export async function getWeekPendingGoals() {
  const lastDayOfWeek = dayjs().endOf('week').toDate()
  const firstDayOfWeek = dayjs().startOf('week').toDate()

  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek)),
  )

  const goalsCompletionCounts = db.$with('goals_completion_counts').as(
    db
      .select({
        completionCount: count(goalCompletions.id).as('completionCount'),
        goalId: goalCompletions.goalId,
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.completedAt, firstDayOfWeek),
          lte(goalCompletions.completedAt, lastDayOfWeek),
        ),
      )
      .groupBy(goalCompletions.goalId),
  )

  const pendingGoals = await db
    .with(goalsCreatedUpToWeek, goalsCompletionCounts)
    .select({
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
      completionCount: sql/* sql */ `
        COALESCE(${goalsCompletionCounts.completionCount}, 0)`.mapWith(Number),
    })
    .from(goalsCreatedUpToWeek)
    .leftJoin(
      goalsCompletionCounts,
      eq(goalsCompletionCounts.goalId, goalsCreatedUpToWeek.id),
    )

  return {
    pendingGoals,
  }
}
