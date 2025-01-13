/*
  Warnings:

  - Added the required column `secret_hash` to the `interfaces` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secret_salt` to the `interfaces` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "interfaces" ADD COLUMN     "secret_hash" TEXT NOT NULL,
ADD COLUMN     "secret_salt" TEXT NOT NULL;
