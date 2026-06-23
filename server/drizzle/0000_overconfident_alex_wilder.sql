CREATE TABLE `admins` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role_level` enum('superadmin','moderator','support') NOT NULL,
	`permissions` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`internship_id` varchar(36) NOT NULL,
	`certificate_number` varchar(50) NOT NULL,
	`file_url` text,
	`metadata` json,
	`issued_at` timestamp NOT NULL DEFAULT (now()),
	`verified_at` timestamp,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_internship_id_unique` UNIQUE(`internship_id`),
	CONSTRAINT `certificates_certificate_number_unique` UNIQUE(`certificate_number`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` varchar(36) NOT NULL,
	`internship_id` varchar(36) NOT NULL,
	`evaluator_role` enum('student','umkm') NOT NULL,
	`rating` int,
	`review_text` text,
	`skill_assessment` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_evaluation_internship_role` UNIQUE(`internship_id`,`evaluator_role`)
);
--> statement-breakpoint
CREATE TABLE `internship_needs` (
	`id` varchar(36) NOT NULL,
	`umkm_id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`required_skills` json,
	`required_major` varchar(100),
	`slot_count` int NOT NULL,
	`slot_filled` int NOT NULL DEFAULT 0,
	`start_date` timestamp,
	`duration_days` int NOT NULL DEFAULT 14,
	`compensation` varchar(100),
	`status` enum('open','closed','filled') NOT NULL DEFAULT 'open',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internship_needs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internships` (
	`id` varchar(36) NOT NULL,
	`match_id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`umkm_id` varchar(36) NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`status` enum('scheduled','active','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`daily_log` json,
	`cancelled_at` timestamp,
	`cancel_reason` text,
	`completed_at` timestamp,
	CONSTRAINT `internships_id` PRIMARY KEY(`id`),
	CONSTRAINT `internships_match_id_unique` UNIQUE(`match_id`)
);
--> statement-breakpoint
CREATE TABLE `matchmaking` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`need_id` varchar(36) NOT NULL,
	`match_score` decimal(5,2),
	`match_details` json,
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`student_response` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`umkm_response` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`matched_at` timestamp,
	`responded_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchmaking_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_match_student_need` UNIQUE(`student_id`,`need_id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` enum('match','schedule','evaluation','certificate','system') NOT NULL,
	`title` varchar(200) NOT NULL,
	`body` text,
	`channel` enum('in_app','whatsapp','email') NOT NULL,
	`reference_id` varchar(36),
	`is_read` boolean NOT NULL DEFAULT false,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_test_answers` (
	`id` varchar(36) NOT NULL,
	`attempt_id` varchar(36) NOT NULL,
	`question_id` varchar(36) NOT NULL,
	`answer_text` text,
	`is_correct` boolean,
	`score_obtained` int,
	`answered_at` timestamp NOT NULL,
	CONSTRAINT `skill_test_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_test_attempts` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`started_at` timestamp NOT NULL,
	`completed_at` timestamp,
	`status` enum('in_progress','completed','expired') NOT NULL DEFAULT 'in_progress',
	`total_score` int,
	`adaptive_level` enum('beginner','intermediate','advanced'),
	CONSTRAINT `skill_test_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_test_questions` (
	`id` varchar(36) NOT NULL,
	`category` varchar(100) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`question_text` text NOT NULL,
	`question_type` enum('multiple_choice','essay','coding') NOT NULL,
	`options` json,
	`correct_answer` text,
	`point_value` int NOT NULL DEFAULT 10,
	`tags` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_test_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_test_results` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`attempt_id` varchar(36) NOT NULL,
	`overall_score` int,
	`skill_breakdown` json,
	`recommended_roles` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_test_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `skill_test_results_attempt_id_unique` UNIQUE(`attempt_id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`nisn` varchar(20),
	`school` varchar(200) NOT NULL,
	`major` varchar(100) NOT NULL,
	`graduation_year` int,
	`bio` text,
	`skills` json,
	`portfolio_url` text,
	`address` text,
	`city` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `students_nisn_unique` UNIQUE(`nisn`)
);
--> statement-breakpoint
CREATE TABLE `umkm` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`business_name` varchar(200) NOT NULL,
	`business_type` varchar(100) NOT NULL,
	`nib` varchar(50),
	`tax_id` varchar(50),
	`description` text,
	`address` text,
	`city` varchar(100),
	`phone_office` varchar(20),
	`website` text,
	`logo_url` text,
	`is_verified` boolean NOT NULL DEFAULT false,
	`verified_at` timestamp,
	`verified_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `umkm_id` PRIMARY KEY(`id`),
	CONSTRAINT `umkm_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`full_name` varchar(150) NOT NULL,
	`role` enum('student','umkm','admin') NOT NULL,
	`avatar_url` text,
	`is_verified` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
ALTER TABLE `admins` ADD CONSTRAINT `admins_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_internship_id_internships_id_fk` FOREIGN KEY (`internship_id`) REFERENCES `internships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_internship_id_internships_id_fk` FOREIGN KEY (`internship_id`) REFERENCES `internships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internship_needs` ADD CONSTRAINT `internship_needs_umkm_id_umkm_id_fk` FOREIGN KEY (`umkm_id`) REFERENCES `umkm`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internships` ADD CONSTRAINT `internships_match_id_matchmaking_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matchmaking`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internships` ADD CONSTRAINT `internships_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internships` ADD CONSTRAINT `internships_umkm_id_umkm_id_fk` FOREIGN KEY (`umkm_id`) REFERENCES `umkm`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchmaking` ADD CONSTRAINT `matchmaking_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchmaking` ADD CONSTRAINT `matchmaking_need_id_internship_needs_id_fk` FOREIGN KEY (`need_id`) REFERENCES `internship_needs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_test_answers` ADD CONSTRAINT `skill_test_answers_attempt_id_skill_test_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `skill_test_attempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_test_answers` ADD CONSTRAINT `skill_test_answers_question_id_skill_test_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `skill_test_questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_test_attempts` ADD CONSTRAINT `skill_test_attempts_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_test_questions` ADD CONSTRAINT `skill_test_questions_created_by_admins_id_fk` FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_test_results` ADD CONSTRAINT `skill_test_results_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_test_results` ADD CONSTRAINT `skill_test_results_attempt_id_skill_test_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `skill_test_attempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `umkm` ADD CONSTRAINT `umkm_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `umkm` ADD CONSTRAINT `umkm_verified_by_admins_id_fk` FOREIGN KEY (`verified_by`) REFERENCES `admins`(`id`) ON DELETE no action ON UPDATE no action;