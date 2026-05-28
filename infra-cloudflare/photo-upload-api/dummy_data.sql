-- ダミーデータ投入用SQL
-- travel_entries と photo_metadata に50件のダミーデータを投入
-- 実行前提: schema.sql が実行済みであること

-- デフォルトユーザーの存在確認（念のため再挿入）
-- INSERT OR IGNORE INTO users (id, email, name) VALUES ('a7745a28-7021-701e-5f59-a46f793cb89e', 'test@example.com', 'Test User');

-- travel_entries と photo_metadata へのダミーデータ投入（50件）

-- 1. 東京タワー
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-001', 'a7745a28-7021-701e-5f59-a46f793cb89e', '東京タワー', '素晴らしい眺めでした。', 'entry-001', '2023-03-15T10:30:00Z', '2023-03-15T10:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-001', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.6586, 139.7454, '2023-03-15T10:30:00Z', 'entry-001');

-- 2. 富士山
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-002', 'a7745a28-7021-701e-5f59-a46f793cb89e', '富士山', '雄大な姿に感動しました。', 'entry-002', '2023-04-20T08:00:00Z', '2023-04-20T08:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-002', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.3606, 138.7274, '2023-04-20T08:00:00Z', 'entry-002');

-- 3. 京都 清水寺
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-003', 'a7745a28-7021-701e-5f59-a46f793cb89e', '清水寺', '歴史を感じる場所でした。', 'entry-003', '2023-05-10T14:20:00Z', '2023-05-10T14:20:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-003', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.9949, 135.7851, '2023-05-10T14:20:00Z', 'entry-003');

-- 4. 大阪城
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-004', 'a7745a28-7021-701e-5f59-a46f793cb89e', '大阪城', '立派な天守閣でした。', 'entry-004', '2023-06-05T11:00:00Z', '2023-06-05T11:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-004', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.6873, 135.5262, '2023-06-05T11:00:00Z', 'entry-004');

-- 5. 広島 平和記念公園
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-005', 'a7745a28-7021-701e-5f59-a46f793cb89e', '平和記念公園', '平和の大切さを実感しました。', 'entry-005', '2023-07-12T09:30:00Z', '2023-07-12T09:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-005', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.3955, 132.4536, '2023-07-12T09:30:00Z', 'entry-005');

-- 6. 札幌 時計台
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-006', 'a7745a28-7021-701e-5f59-a46f793cb89e', '札幌時計台', 'レトロな雰囲気が良かったです。', 'entry-006', '2023-08-18T15:45:00Z', '2023-08-18T15:45:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-006', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 43.0627, 141.3535, '2023-08-18T15:45:00Z', 'entry-006');

-- 7. 鎌倉 大仏
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-007', 'a7745a28-7021-701e-5f59-a46f793cb89e', '鎌倉大仏', '圧倒的な存在感でした。', 'entry-007', '2023-09-03T10:15:00Z', '2023-09-03T10:15:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-007', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.3170, 139.5362, '2023-09-03T10:15:00Z', 'entry-007');

-- 8. 奈良公園
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-008', 'a7745a28-7021-701e-5f59-a46f793cb89e', '奈良公園', '鹿と触れ合えて楽しかったです。', 'entry-008', '2023-10-22T13:00:00Z', '2023-10-22T13:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-008', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.6851, 135.8431, '2023-10-22T13:00:00Z', 'entry-008');

-- 9. 金閣寺
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-009', 'a7745a28-7021-701e-5f59-a46f793cb89e', '金閣寺', '金色に輝く姿が美しかったです。', 'entry-009', '2023-11-08T11:30:00Z', '2023-11-08T11:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-009', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.0394, 135.7292, '2023-11-08T11:30:00Z', 'entry-009');

-- 10. 長崎 グラバー園
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-010', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'グラバー園', '異国情緒あふれる場所でした。', 'entry-010', '2023-12-01T14:00:00Z', '2023-12-01T14:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-010', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 32.7348, 129.8701, '2023-12-01T14:00:00Z', 'entry-010');

-- 11. 横浜 中華街
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-011', 'a7745a28-7021-701e-5f59-a46f793cb89e', '横浜中華街', '美味しい食べ物がたくさんありました。', 'entry-011', '2024-01-15T12:00:00Z', '2024-01-15T12:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-011', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.4437, 139.6456, '2024-01-15T12:00:00Z', 'entry-011');

-- 12. 仙台 青葉城跡
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-012', 'a7745a28-7021-701e-5f59-a46f793cb89e', '青葉城跡', '伊達政宗の像が印象的でした。', 'entry-012', '2024-02-20T10:00:00Z', '2024-02-20T10:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-012', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 38.2544, 140.8634, '2024-02-20T10:00:00Z', 'entry-012');

-- 13. 名古屋城
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-013', 'a7745a28-7021-701e-5f59-a46f793cb89e', '名古屋城', '金のシャチホコが有名です。', 'entry-013', '2024-03-10T11:45:00Z', '2024-03-10T11:45:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-013', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.1856, 136.8999, '2024-03-10T11:45:00Z', 'entry-013');

-- 14. 沖縄 首里城
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-014', 'a7745a28-7021-701e-5f59-a46f793cb89e', '首里城', '琉球王国の歴史を感じました。', 'entry-014', '2024-04-05T09:00:00Z', '2024-04-05T09:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-014', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 26.2174, 127.7191, '2024-04-05T09:00:00Z', 'entry-014');

-- 15. 函館 五稜郭
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-015', 'a7745a28-7021-701e-5f59-a46f793cb89e', '五稜郭', '星型の城郭が面白かったです。', 'entry-015', '2024-05-12T13:30:00Z', '2024-05-12T13:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-015', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 41.7969, 140.7575, '2024-05-12T13:30:00Z', 'entry-015');

-- 16. 日光東照宮
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-016', 'a7745a28-7021-701e-5f59-a46f793cb89e', '日光東照宮', '豪華絢爛な装飾が見事でした。', 'entry-016', '2024-06-08T10:30:00Z', '2024-06-08T10:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-016', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 36.7580, 139.5987, '2024-06-08T10:30:00Z', 'entry-016');

-- 17. 松本城
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-017', 'a7745a28-7021-701e-5f59-a46f793cb89e', '松本城', '黒い天守閣がかっこいいです。', 'entry-017', '2024-07-15T14:00:00Z', '2024-07-15T14:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-017', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 36.2382, 137.9691, '2024-07-15T14:00:00Z', 'entry-017');

-- 18. 高知城
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-018', 'a7745a28-7021-701e-5f59-a46f793cb89e', '高知城', '現存天守が素晴らしいです。', 'entry-018', '2024-08-20T11:15:00Z', '2024-08-20T11:15:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-018', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 33.5610, 133.5311, '2024-08-20T11:15:00Z', 'entry-018');

-- 19. 姫路城
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-019', 'a7745a28-7021-701e-5f59-a46f793cb89e', '姫路城', '白鷺城と呼ばれる美しい城です。', 'entry-019', '2024-09-10T09:45:00Z', '2024-09-10T09:45:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-019', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.8394, 134.6939, '2024-09-10T09:45:00Z', 'entry-019');

-- 20. 箱根 芦ノ湖
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-020', 'a7745a28-7021-701e-5f59-a46f793cb89e', '芦ノ湖', '富士山の眺めが最高でした。', 'entry-020', '2024-10-05T12:30:00Z', '2024-10-05T12:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-020', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.2048, 139.0267, '2024-10-05T12:30:00Z', 'entry-020');

-- 21. 軽井沢
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-021', 'a7745a28-7021-701e-5f59-a46f793cb89e', '軽井沢', '避暑地として快適でした。', 'entry-021', '2024-11-12T10:00:00Z', '2024-11-12T10:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-021', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 36.3527, 138.5989, '2024-11-12T10:00:00Z', 'entry-021');

-- 22. 白川郷
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-022', 'a7745a28-7021-701e-5f59-a46f793cb89e', '白川郷', '合掌造りの集落が美しいです。', 'entry-022', '2024-12-03T13:20:00Z', '2024-12-03T13:20:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-022', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 36.2580, 136.9061, '2024-12-03T13:20:00Z', 'entry-022');

-- 23. 伊勢神宮
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-023', 'a7745a28-7021-701e-5f59-a46f793cb89e', '伊勢神宮', '神聖な雰囲気に包まれました。', 'entry-023', '2025-01-18T09:00:00Z', '2025-01-18T09:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-023', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.4552, 136.7256, '2025-01-18T09:00:00Z', 'entry-023');

-- 24. 出雲大社
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-024', 'a7745a28-7021-701e-5f59-a46f793cb89e', '出雲大社', '縁結びの神様で有名です。', 'entry-024', '2025-02-14T11:30:00Z', '2025-02-14T11:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-024', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.4018, 132.6852, '2025-02-14T11:30:00Z', 'entry-024');

-- 25. 別府温泉
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-025', 'a7745a28-7021-701e-5f59-a46f793cb89e', '別府温泉', '地獄めぐりが楽しかったです。', 'entry-025', '2025-03-08T14:45:00Z', '2025-03-08T14:45:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-025', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 33.2846, 131.4912, '2025-03-08T14:45:00Z', 'entry-025');

-- 26. 宮島 厳島神社
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-026', 'a7745a28-7021-701e-5f59-a46f793cb89e', '厳島神社', '海に浮かぶ鳥居が神秘的でした。', 'entry-026', '2025-04-20T10:15:00Z', '2025-04-20T10:15:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-026', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.2960, 132.3197, '2025-04-20T10:15:00Z', 'entry-026');

-- 27. 熊本城
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-027', 'a7745a28-7021-701e-5f59-a46f793cb89e', '熊本城', '復興が進んでいました。', 'entry-027', '2025-05-15T12:00:00Z', '2025-05-15T12:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-027', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 32.8064, 130.7056, '2025-05-15T12:00:00Z', 'entry-027');

-- 28. 鹿児島 桜島
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-028', 'a7745a28-7021-701e-5f59-a46f793cb89e', '桜島', '活火山の迫力を感じました。', 'entry-028', '2025-06-10T09:30:00Z', '2025-06-10T09:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-028', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 31.5855, 130.6570, '2025-06-10T09:30:00Z', 'entry-028');

-- 29. 伊豆半島
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-029', 'a7745a28-7021-701e-5f59-a46f793cb89e', '伊豆半島', '海岸線のドライブが気持ち良かったです。', 'entry-029', '2025-07-22T15:00:00Z', '2025-07-22T15:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-029', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.9096, 138.9479, '2025-07-22T15:00:00Z', 'entry-029');

-- 30. 上高地
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-030', 'a7745a28-7021-701e-5f59-a46f793cb89e', '上高地', '大自然の中で癒されました。', 'entry-030', '2025-08-05T11:00:00Z', '2025-08-05T11:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-030', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 36.2505, 137.6433, '2025-08-05T11:00:00Z', 'entry-030');

-- 31. 黒部ダム
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-031', 'a7745a28-7021-701e-5f59-a46f793cb89e', '黒部ダム', '放水の迫力がすごかったです。', 'entry-031', '2025-09-18T13:45:00Z', '2025-09-18T13:45:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-031', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 36.5659, 137.6626, '2025-09-18T13:45:00Z', 'entry-031');

-- 32. 尾瀬
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-032', 'a7745a28-7021-701e-5f59-a46f793cb89e', '尾瀬', '湿原の景色が素晴らしかったです。', 'entry-032', '2025-10-03T10:30:00Z', '2025-10-03T10:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-032', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 36.8806, 139.2834, '2025-10-03T10:30:00Z', 'entry-032');

-- 33. 富良野
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-033', 'a7745a28-7021-701e-5f59-a46f793cb89e', '富良野', 'ラベンダー畑が美しかったです。', 'entry-033', '2025-11-20T14:15:00Z', '2025-11-20T14:15:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-033', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 43.3417, 142.3833, '2025-11-20T14:15:00Z', 'entry-033');

-- 34. 知床半島
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-034', 'a7745a28-7021-701e-5f59-a46f793cb89e', '知床半島', '世界自然遺産の雄大さを感じました。', 'entry-034', '2025-12-05T09:00:00Z', '2025-12-05T09:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-034', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 44.0870, 145.0966, '2025-12-05T09:00:00Z', 'entry-034');

-- 35. 高尾山
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-035', 'a7745a28-7021-701e-5f59-a46f793cb89e', '高尾山', '気軽に登れて良かったです。', 'entry-035', '2026-01-10T12:30:00Z', '2026-01-10T12:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-035', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.6251, 139.2441, '2026-01-10T12:30:00Z', 'entry-035');

-- 36. 江ノ島
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-036', 'a7745a28-7021-701e-5f59-a46f793cb89e', '江ノ島', '海と島の景色が良かったです。', 'entry-036', '2023-07-25T15:30:00Z', '2023-07-25T15:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-036', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.2999, 139.4803, '2023-07-25T15:30:00Z', 'entry-036');

-- 37. 富士山 五合目
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-037', 'a7745a28-7021-701e-5f59-a46f793cb89e', '富士山五合目', '雲海が綺麗でした。', 'entry-037', '2024-08-12T08:45:00Z', '2024-08-12T08:45:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-037', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.3606, 138.7274, '2024-08-12T08:45:00Z', 'entry-037');

-- 38. 伏見稲荷大社
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-038', 'a7745a28-7021-701e-5f59-a46f793cb89e', '伏見稲荷大社', '千本鳥居が圧巻でした。', 'entry-038', '2023-09-15T11:00:00Z', '2023-09-15T11:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-038', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.9671, 135.7727, '2023-09-15T11:00:00Z', 'entry-038');

-- 39. 東京スカイツリー
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-039', 'a7745a28-7021-701e-5f59-a46f793cb89e', '東京スカイツリー', '展望台からの眺めが最高でした。', 'entry-039', '2024-03-28T13:15:00Z', '2024-03-28T13:15:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-039', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.7101, 139.8107, '2024-03-28T13:15:00Z', 'entry-039');

-- 40. 浅草寺
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-040', 'a7745a28-7021-701e-5f59-a46f793cb89e', '浅草寺', '雷門が印象的でした。', 'entry-040', '2025-02-20T10:45:00Z', '2025-02-20T10:45:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-040', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.7148, 139.7967, '2025-02-20T10:45:00Z', 'entry-040');

-- 41. 明治神宮
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-041', 'a7745a28-7021-701e-5f59-a46f793cb89e', '明治神宮', '都会のオアシスのようでした。', 'entry-041', '2024-05-30T09:30:00Z', '2024-05-30T09:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-041', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.6764, 139.6993, '2024-05-30T09:30:00Z', 'entry-041');

-- 42. 銀閣寺
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-042', 'a7745a28-7021-701e-5f59-a46f793cb89e', '銀閣寺', '侘び寂びを感じました。', 'entry-042', '2023-11-25T14:00:00Z', '2023-11-25T14:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-042', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.0269, 135.7983, '2023-11-25T14:00:00Z', 'entry-042');

-- 43. 彦根城
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-043', 'a7745a28-7021-701e-5f59-a46f793cb89e', '彦根城', 'ひこにゃんに会えました。', 'entry-043', '2024-06-18T11:20:00Z', '2024-06-18T11:20:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-043', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.2760, 136.2513, '2024-06-18T11:20:00Z', 'entry-043');

-- 44. 岡山 後楽園
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-044', 'a7745a28-7021-701e-5f59-a46f793cb89e', '後楽園', '日本三名園の一つです。', 'entry-044', '2025-04-05T10:00:00Z', '2025-04-05T10:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-044', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 34.6638, 133.9342, '2025-04-05T10:00:00Z', 'entry-044');

-- 45. 金沢 兼六園
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-045', 'a7745a28-7021-701e-5f59-a46f793cb89e', '兼六園', '四季折々の美しさがあります。', 'entry-045', '2024-10-20T12:45:00Z', '2024-10-20T12:45:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-045', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 36.5621, 136.6625, '2024-10-20T12:45:00Z', 'entry-045');

-- 46. 松島
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-046', 'a7745a28-7021-701e-5f59-a46f793cb89e', '松島', '日本三景の一つで絶景でした。', 'entry-046', '2025-07-08T09:15:00Z', '2025-07-08T09:15:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-046', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 38.3687, 141.0663, '2025-07-08T09:15:00Z', 'entry-046');

-- 47. 天橋立
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-047', 'a7745a28-7021-701e-5f59-a46f793cb89e', '天橋立', '股のぞきで見る景色が有名です。', 'entry-047', '2023-06-12T13:30:00Z', '2023-06-12T13:30:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-047', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.5651, 135.1953, '2023-06-12T13:30:00Z', 'entry-047');

-- 48. 小樽運河
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-048', 'a7745a28-7021-701e-5f59-a46f793cb89e', '小樽運河', 'ロマンチックな雰囲気でした。', 'entry-048', '2024-09-25T16:00:00Z', '2024-09-25T16:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-048', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 43.1907, 140.9942, '2024-09-25T16:00:00Z', 'entry-048');

-- 49. 東京タワー（夜景）
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-049', 'a7745a28-7021-701e-5f59-a46f793cb89e', '東京タワー夜景', 'ライトアップが美しかったです。', 'entry-049', '2025-08-30T20:00:00Z', '2025-08-30T20:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-049', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.6586, 139.7454, '2025-08-30T20:00:00Z', 'entry-049');

-- 50. 鎌倉 鶴岡八幡宮
INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, created_at, updated_at)
VALUES ('entry-050', 'a7745a28-7021-701e-5f59-a46f793cb89e', '鶴岡八幡宮', '鎌倉の中心的な神社です。', 'entry-050', '2026-01-25T11:00:00Z', '2026-01-25T11:00:00Z');
INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, uploaded_at, entry_id)
VALUES ('photo-050', 'a7745a28-7021-701e-5f59-a46f793cb89e', 'a7745a28-7021-701e-5f59-a46f793cb89e/dummy_image.png', 35.3262, 139.5557, '2026-01-25T11:00:00Z', 'entry-050');
