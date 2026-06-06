import {pgTable,uuid,text,timestamp,jsonb, integer} from "drizzle-orm/pg-core";
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
export const evidence = pgTable("evidence", {
    id: uuid("id").defaultRandom().primaryKey(),
    incidentId: uuid("incident_id").notNull(),
    extractedData: text("extracted_data"),
    sourceFile: text("source_file"),
    createdAt: timestamp("created_at").defaultNow()
});
export const reports = pgTable("reports", {
    id: uuid("id").defaultRandom().primaryKey(),
    incidentId: uuid("incident_id").notNull(),
    aiPayload: jsonb("ai_payload"),
    modelUsed: text("model_used"),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow()
});export const causalGraphNodes = pgTable("causal_graph_nodes", {
    id: uuid("id").defaultRandom().primaryKey(),
    componentName: text("component_name").notNull().unique(),
    componentType: text("component_type").default("service"),
    firstSeenAt: timestamp("first_seen_at").defaultNow(),
    incidentCount: integer("incident_count").default(1).notNull()
});

export const causalGraphEdges = pgTable("causal_graph_edges", {
    id: uuid("id").defaultRandom().primaryKey(),
    fromNodeId: uuid("from_node_id").notNull().references(() => causalGraphNodes.id),
    toNodeId: uuid("to_node_id").notNull().references(() => causalGraphNodes.id),
    failureType: text("failure_type").default("cascade"),
    occurrenceCount: integer("occurrence_count").default(1).notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow()
});
