import z from 'zod'

const envSchema = z.object({
  PORT: z.string().default('4000'),
  DATABASE_URL: z
    .string()
    .default('postgresql://docker:docker@localhost:5432/inorbit'),
})

export const env = envSchema.parse(process.env)
