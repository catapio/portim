/*
  Warnings:

  - You are about to drop the column `user_id` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `client_id` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "user_id",
ADD COLUMN     "client_id" VARCHAR(24) NOT NULL;

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "clients" (
    "id" VARCHAR(24) NOT NULL DEFAULT generate_hex_object_id(),
    "project_id" VARCHAR(24) NOT NULL,
    "external_id" VARCHAR(50) NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
