-- CreateTable
CREATE TABLE "interfaces" (
    "id" VARCHAR(24) NOT NULL DEFAULT generate_hex_object_id(),
    "name" VARCHAR(20) NOT NULL,
    "event_endpoint" TEXT NOT NULL,
    "control_endpoint" TEXT NOT NULL,
    "control" VARCHAR(24),
    "external_id_field" TEXT NOT NULL,
    "project_id" VARCHAR(24) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "interfaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(24) NOT NULL DEFAULT generate_hex_object_id(),
    "external_id" VARCHAR(50) NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" VARCHAR(24) NOT NULL DEFAULT generate_hex_object_id(),
    "source" VARCHAR(24) NOT NULL,
    "target" VARCHAR(24) NOT NULL,
    "user_id" VARCHAR(24) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" VARCHAR(24) NOT NULL DEFAULT generate_hex_object_id(),
    "session_id" VARCHAR(24) NOT NULL,
    "content" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_source_fkey" FOREIGN KEY ("source") REFERENCES "interfaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
