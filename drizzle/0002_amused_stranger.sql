ALTER TABLE "evidence" ALTER COLUMN "extracted_data" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "ai_payload" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "summary";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "hypotheses";