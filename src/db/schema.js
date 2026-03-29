import {pgTable,uuid,text,timestamp,jsonb} from "drizzle-orm/pg-core";
export const users = pgTable("users",{
id: uuid("id").defaultRandom().primaryKey(),
email: text("email").notNull().unique(),
passwordHash: text("password_hash").notNull(),
createAt: timestamp("created_at").defaultNow()
});
export const incidents = pgTable("incidents", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default("pending"),
    createdAt: timestamp("created_at").defaultNow()
});
export const incidentFiles = pgTable("incident_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  incidentId: uuid("incident_id").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow()
});
export const evidence  = pgTable("evidence",{
    id: uuid("id").defaultRandom().primaryKey(),
    incidentId: uuid("incident_id").notNull(),
    extractedData: text("extracted_data"),
    createdAt: timestamp("created_at").defaultNow()
});
export const reports = pgTable("reports", {
    id: uuid("id").defaultRandom().primaryKey(),
    incidentId: uuid("incident_id").notNull(),
   aiPayload: jsonb("ai_payload"),
    modelUsed: text("model_used"),
    createdAt: timestamp("created_at").defaultNow()
});