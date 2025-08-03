-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 01, 2025 at 06:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `2ndyear_3rdsem`
--

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `customer_id` int(11) NOT NULL,
  `title` varchar(45) DEFAULT NULL,
  `last_name` varchar(45) NOT NULL,
  `first_name` varchar(45) NOT NULL,
  `address` varchar(45) DEFAULT NULL,
  `city` varchar(45) DEFAULT NULL,
  `zipcode` varchar(45) DEFAULT NULL,
  `phone` varchar(45) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT 'storage/images/logo1.png',
  `user_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `title`, `last_name`, `first_name`, `address`, `city`, `zipcode`, `phone`, `image_path`, `user_id`) VALUES
(1, '', 'Maranan', 'Adealix Jairon', 'Block 29, Lot 31, Damayan Area, Central Signa', 'Taguig City', '1633', '09157782493', 'storage/images/logo1.png', 1);

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(11) NOT NULL,
  `name` varchar(45) NOT NULL,
  `description` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `cost_price` decimal(9,2) DEFAULT NULL,
  `sell_price` decimal(9,2) DEFAULT NULL,
  `show_item` enum('yes','no') NOT NULL DEFAULT 'yes'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`item_id`, `name`, `description`, `category`, `cost_price`, `sell_price`, `show_item`) VALUES
(1, 'Gadget A1', 'High‑performance portable charger', 'Mobile & Wearable Tech', 15.00, 25.00, 'yes'),
(2, 'Gadget A2', 'Wireless earbuds with noise cancelling', 'Audio & Entertainment Devices', 40.00, 60.00, 'yes'),
(3, 'Gadget A3', 'Smart LED bulb, color‑changing', 'Smart Home Devices', 8.50, 15.00, 'yes'),
(4, 'Gadget A4', 'Bluetooth speaker, waterproof', 'Audio & Entertainment Devices', 28.00, 45.00, 'yes'),
(5, 'Gadget A5', 'Smart plug (Wi‑Fi enabled)', 'Smart Home Devices', 10.00, 18.00, 'yes'),
(6, 'Gadget A6', 'Gaming mouse, RGB lighting', 'Computers & Peripherals', 20.00, 35.00, 'yes'),
(7, 'Gadget A7', 'Mechanical keyboard, tenkeyless', 'Computers & Peripherals', 45.00, 70.00, 'yes'),
(8, 'Gadget A8', 'Smartwatch fitness tracker', 'Mobile & Wearable Tech', 25.00, 40.00, 'yes'),
(9, 'Gadget A9', 'USB‑C fast charger, 65W', 'Computers & Peripherals', 12.00, 22.00, 'yes'),
(10, 'Gadget A10', 'VR headset, entry level', 'Gaming & VR Gear', 50.00, 80.00, 'yes'),
(11, 'Gadget B1', 'Drone with HD camera', 'Gaming & VR Gear', 100.00, 150.00, 'yes'),
(12, 'Gadget B2', 'Smart thermostat sensor', 'Smart Home Devices', 18.00, 30.00, 'yes'),
(13, 'Gadget B3', 'Portable SSD 1TB', 'Computers & Peripherals', 80.00, 120.00, 'yes'),
(14, 'Gadget B4', 'Action camera 4K', 'Audio & Entertainment Devices', 90.00, 140.00, 'yes'),
(15, 'Gadget B5', 'Smart doorbell camera', 'Smart Home Devices', 60.00, 95.00, 'yes'),
(16, 'Gadget B6', 'Gaming headset wired', 'Gaming & VR Gear', 30.00, 55.00, 'yes'),
(17, 'Gadget B7', 'Wireless keyboard and mouse combo', 'Computers & Peripherals', 22.00, 40.00, 'yes'),
(18, 'Gadget B8', 'Foldable Bluetooth keyboard', 'Mobile & Wearable Tech', 15.00, 28.00, 'yes'),
(19, 'Gadget B9', 'Smart light strip (5 m)', 'Smart Home Devices', 20.00, 33.00, 'yes'),
(20, 'Gadget B10', 'Echo smart speaker clone', 'Audio & Entertainment Devices', 35.00, 55.00, 'yes'),
(21, 'Gadget C1', 'Portable projector 1080p', 'Audio & Entertainment Devices', 85.00, 130.00, 'yes'),
(22, 'Gadget C2', 'Smart lock door accessory', 'Smart Home Devices', 50.00, 90.00, 'yes'),
(23, 'Gadget C3', 'Wireless charging pad 15W', 'Mobile & Wearable Tech', 10.00, 18.00, 'yes'),
(24, 'Gadget C4', 'Webcam 1080p USB', 'Computers & Peripherals', 25.00, 45.00, 'yes'),
(25, 'Gadget C5', 'Gaming controller Bluetooth', 'Gaming & VR Gear', 35.00, 60.00, 'yes'),
(26, 'Gadget C6', 'Noise cancelling wireless headphones', 'Audio & Entertainment Devices', 60.00, 95.00, 'yes'),
(27, 'Gadget C7', 'Smart motion sensor kit', 'Smart Home Devices', 22.00, 38.00, 'yes'),
(28, 'Gadget C8', 'USB hub 4‑port USB‑C', 'Computers & Peripherals', 8.00, 15.00, 'yes'),
(29, 'Gadget C9', 'Smart fitness band basic', 'Mobile & Wearable Tech', 12.00, 20.00, 'yes'),
(30, 'Gadget C10', 'VR controller motion sensor', 'Gaming & VR Gear', 40.00, 65.00, 'yes'),
(31, 'Gadget A1', 'High‑performance portable charger', 'Mobile & Wearable Tech', 15.00, 25.00, 'yes'),
(32, 'Gadget A2', 'Wireless earbuds with noise cancelling', 'Audio & Entertainment Devices', 40.00, 60.00, 'yes'),
(33, 'Gadget A3', 'Smart LED bulb, color‑changing', 'Smart Home Devices', 8.50, 15.00, 'yes'),
(34, 'Gadget A4', 'Bluetooth speaker, waterproof', 'Audio & Entertainment Devices', 28.00, 45.00, 'yes'),
(35, 'Gadget A5', 'Smart plug (Wi‑Fi enabled)', 'Smart Home Devices', 10.00, 18.00, 'yes'),
(36, 'Gadget A6', 'Gaming mouse, RGB lighting', 'Computers & Peripherals', 20.00, 35.00, 'yes'),
(37, 'Gadget A7', 'Mechanical keyboard, tenkeyless', 'Computers & Peripherals', 45.00, 70.00, 'yes'),
(38, 'Gadget A8', 'Smartwatch fitness tracker', 'Mobile & Wearable Tech', 25.00, 40.00, 'yes'),
(39, 'Gadget A9', 'USB‑C fast charger, 65W', 'Computers & Peripherals', 12.00, 22.00, 'yes'),
(40, 'Gadget A10', 'VR headset, entry level', 'Gaming & VR Gear', 50.00, 80.00, 'yes'),
(41, 'Gadget B1', 'Drone with HD camera', 'Gaming & VR Gear', 100.00, 150.00, 'yes'),
(42, 'Gadget B2', 'Smart thermostat sensor', 'Smart Home Devices', 18.00, 30.00, 'yes'),
(43, 'Gadget B3', 'Portable SSD 1TB', 'Computers & Peripherals', 80.00, 120.00, 'yes'),
(44, 'Gadget B4', 'Action camera 4K', 'Audio & Entertainment Devices', 90.00, 140.00, 'yes'),
(45, 'Gadget B5', 'Smart doorbell camera', 'Smart Home Devices', 60.00, 95.00, 'yes'),
(46, 'Gadget B6', 'Gaming headset wired', 'Gaming & VR Gear', 30.00, 55.00, 'yes'),
(47, 'Gadget B7', 'Wireless keyboard and mouse combo', 'Computers & Peripherals', 22.00, 40.00, 'yes'),
(48, 'Gadget B8', 'Foldable Bluetooth keyboard', 'Mobile & Wearable Tech', 15.00, 28.00, 'yes'),
(49, 'Gadget B9', 'Smart light strip (5 m)', 'Smart Home Devices', 20.00, 33.00, 'yes'),
(50, 'Gadget B10', 'Echo smart speaker clone', 'Audio & Entertainment Devices', 35.00, 55.00, 'yes'),
(51, 'Gadget C1', 'Portable projector 1080p', 'Audio & Entertainment Devices', 85.00, 130.00, 'yes'),
(52, 'Gadget C2', 'Smart lock door accessory', 'Smart Home Devices', 50.00, 90.00, 'yes'),
(53, 'Gadget C3', 'Wireless charging pad 15W', 'Mobile & Wearable Tech', 10.00, 18.00, 'yes'),
(54, 'Gadget C4', 'Webcam 1080p USB', 'Computers & Peripherals', 25.00, 45.00, 'yes'),
(55, 'Gadget C5', 'Gaming controller Bluetooth', 'Gaming & VR Gear', 35.00, 60.00, 'yes'),
(56, 'Gadget C6', 'Noise cancelling wireless headphones', 'Audio & Entertainment Devices', 60.00, 95.00, 'yes'),
(57, 'Gadget C7', 'Smart motion sensor kit', 'Smart Home Devices', 22.00, 38.00, 'yes'),
(58, 'Gadget C8', 'USB hub 4‑port USB‑C', 'Computers & Peripherals', 8.00, 15.00, 'yes'),
(59, 'Gadget C9', 'Smart fitness band basic', 'Mobile & Wearable Tech', 12.00, 20.00, 'yes'),
(60, 'Gadget C10', 'VR controller motion sensor', 'Gaming & VR Gear', 40.00, 65.00, 'yes');

-- --------------------------------------------------------

--
-- Table structure for table `items_images`
--

CREATE TABLE `items_images` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_reviews`
--

CREATE TABLE `item_reviews` (
  `review_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `rating` tinyint(1) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `review_text` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(28, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(29, '2025_07_02_133819_create_customer_table', 1),
(30, '2025_07_02_133819_create_failed_jobs_table', 1),
(31, '2025_07_02_133819_create_items_images_table', 1),
(32, '2025_07_02_133819_create_items_table', 1),
(33, '2025_07_02_133819_create_order_receipts_table', 1),
(34, '2025_07_02_133819_create_orderline_table', 1),
(35, '2025_07_02_133819_create_orders_table', 1),
(36, '2025_07_02_133819_create_password_reset_tokens_table', 1),
(37, '2025_07_02_133819_create_stock_table', 1),
(38, '2025_07_02_133819_create_users_table', 1),
(39, '2025_07_02_133822_add_foreign_keys_to_customer_table', 1),
(40, '2025_07_02_133822_add_foreign_keys_to_items_images_table', 1),
(41, '2025_07_02_133822_add_foreign_keys_to_order_receipts_table', 1),
(42, '2025_07_02_133822_add_foreign_keys_to_orderline_table', 1),
(43, '2025_07_02_133822_add_foreign_keys_to_orders_table', 1),
(44, '2025_07_02_133822_add_foreign_keys_to_stock_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `orderline`
--

CREATE TABLE `orderline` (
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orderline`
--

INSERT INTO `orderline` (`order_id`, `item_id`, `quantity`) VALUES
(1, 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `date_ordered` date DEFAULT NULL,
  `date_delivery` date DEFAULT NULL,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT 50.00,
  `status` enum('processing','delivered','canceled') NOT NULL DEFAULT 'processing',
  `updated_at` timestamp NULL DEFAULT NULL,
  `customer_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `date_ordered`, `date_delivery`, `shipping_fee`, `status`, `updated_at`, `customer_id`) VALUES
(1, '2025-07-30', '2025-07-30', 50.00, 'delivered', '2025-07-30 06:16:13', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock`
--

CREATE TABLE `stock` (
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock`
--

INSERT INTO `stock` (`item_id`, `quantity`) VALUES
(1, 50),
(2, 60),
(3, 100),
(4, 80),
(5, 120),
(6, 90),
(7, 75),
(8, 110),
(9, 95),
(10, 70),
(11, 40),
(12, 65),
(13, 55),
(14, 45),
(15, 30),
(16, 85),
(17, 100),
(18, 110),
(19, 105),
(20, 60),
(21, 50),
(22, 45),
(23, 130),
(24, 80),
(25, 90),
(26, 55),
(27, 100),
(28, 75),
(29, 115),
(30, 95);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `api_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `email_verified_at`, `password`, `remember_token`, `status`, `role`, `created_at`, `updated_at`, `deleted_at`, `api_token`) VALUES
(1, 'adealixmaranan123@gmail.com', '2025-07-30 06:13:53', '$2b$10$J4yxvILHpq5OGBWGqiHXiOGJ8uki6zDDmZ4vil79dryqC9XGzLjDS', NULL, 'active', 'admin', NULL, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUzODU4MjAyfQ.pGEYRySGP9HZsdjZuJ6p98u65Q6Lg_zqijiXPZln4jk');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `items_images`
--
ALTER TABLE `items_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `item_reviews`
--
ALTER TABLE `item_reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD UNIQUE KEY `uk_item_reviews_customer_item` (`item_id`,`customer_id`),
  ADD KEY `idx_item_reviews_item_id` (`item_id`),
  ADD KEY `idx_item_reviews_customer_id` (`customer_id`),
  ADD KEY `idx_item_reviews_rating` (`rating`),
  ADD KEY `idx_item_reviews_created` (`created_at`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orderline`
--
ALTER TABLE `orderline`
  ADD PRIMARY KEY (`item_id`,`order_id`),
  ADD KEY `idx_orderline_order` (`order_id`),
  ADD KEY `fk_items_has_orders_items1_idx` (`item_id`),
  ADD KEY `fk_items_has_orders_orders1_idx` (`order_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_orders_customer` (`customer_id`),
  ADD KEY `fk_orders_customers_idx` (`customer_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `items_images`
--
ALTER TABLE `items_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_reviews`
--
ALTER TABLE `item_reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `customer`
--
ALTER TABLE `customer`
  ADD CONSTRAINT `fk_customer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `items_images`
--
ALTER TABLE `items_images`
  ADD CONSTRAINT `fk_items_images_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item_reviews`
--
ALTER TABLE `item_reviews`
  ADD CONSTRAINT `fk_item_reviews_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_item_reviews_item_id` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orderline`
--
ALTER TABLE `orderline`
  ADD CONSTRAINT `fk_orderline_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orderline_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON UPDATE CASCADE;

--
-- Constraints for table `stock`
--
ALTER TABLE `stock`
  ADD CONSTRAINT `stock_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
