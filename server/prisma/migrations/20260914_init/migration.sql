-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "community_code" TEXT NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "item_condition" TEXT NOT NULL DEFAULT 'Good',
    "image_url" TEXT,
    "deposit_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "borrower_id" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "pickup_image_url" TEXT,
    "return_image_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "reviewee_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_community_code_idx" ON "users"("community_code");

-- CreateIndex
CREATE INDEX "items_owner_id_idx" ON "items"("owner_id");

-- CreateIndex
CREATE INDEX "bookings_item_id_idx" ON "bookings"("item_id");

-- CreateIndex
CREATE INDEX "bookings_borrower_id_idx" ON "bookings"("borrower_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_start_date_end_date_idx" ON "bookings"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_reviewer_id_key" ON "reviews"("booking_id", "reviewer_id");

-- CreateIndex
CREATE INDEX "reviews_reviewee_id_idx" ON "reviews"("reviewee_id");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
