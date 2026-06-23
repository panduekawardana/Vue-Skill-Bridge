CREATE TABLE `support_tickets` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`subject` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`assigned_to` varchar(36),
	`resolved_at` timestamp,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_need_umkm_status` ON `internship_needs` (`umkm_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_internship_status` ON `internships` (`status`,`start_date`);--> statement-breakpoint
CREATE INDEX `idx_match_student_status` ON `matchmaking` (`student_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_match_need_status` ON `matchmaking` (`need_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_notif_user_unread` ON `notifications` (`user_id`,`is_read`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_result_student` ON `skill_test_results` (`student_id`);