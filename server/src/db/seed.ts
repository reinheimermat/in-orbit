import { client, db } from '.'
import { goals, goalCompletions } from './schema'
import dayjs from 'dayjs'

async function seed() {
  await db.delete(goalCompletions)
  await db.delete(goals)

  const result = await db
    .insert(goals)
    .values([
      { title: 'Learn to cook', desiredWeeklyFrequency: 5 },
      { title: 'Learn to dance', desiredWeeklyFrequency: 3 },
      { title: 'Learn to code', desiredWeeklyFrequency: 1 },
    ])
    .returning()

  const starOfWeek = dayjs().startOf('week')

  await db.insert(goalCompletions).values([
    {
      goalId: result[0].id,
      completedAt: starOfWeek.toDate(),
    },
    {
      goalId: result[0].id,
      completedAt: starOfWeek.add(1, 'day').toDate(),
    },
  ])
}

seed().finally(() => {
  client.end()
})
