/*
  Warnings:

  - The primary key for the `projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `projects` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(24)`.
  - You are about to alter the column `name` on the `projects` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `owner_id` on the `projects` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.

*/
-- AlterTable
ALTER TABLE "projects" DROP CONSTRAINT "projects_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(24),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "owner_id" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");
