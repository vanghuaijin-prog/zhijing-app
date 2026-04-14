# 智净 24H 后端数据结构

## 当前架构

项目已经从“静态前端 + 内存假数据”升级为：

- 前端：React 页面通过统一 API client 请求后端
- 后端：Express 负责鉴权、业务编排、数据校验
- 数据存储：Supabase PostgreSQL

前端不会直接写 Supabase，所有敏感写入都通过后端完成。

## 核心表

### `app_users`

用户账号与账户资产。

关键字段：

- `username`
- `phone`
- `email`
- `password_hash`
- `display_name`
- `avatar_url`
- `wallet_balance`
- `wash_credits`
- `default_station_id`
- `time_card_expires_at`

### `memberships`

会员等级与成长值。

关键字段：

- `user_id`
- `tier`
- `label`
- `growth_value`
- `next_tier_growth_value`

### `membership_benefits`

会员权益明细。

关键字段：

- `membership_user_id`
- `title`
- `description`
- `icon`
- `sort_order`

### `stations`

门店基础信息。

关键字段：

- `name`
- `city`
- `district`
- `address`
- `latitude`
- `longitude`
- `distance_km`
- `tags`

### `devices`

设备状态与门店归属。

关键字段：

- `station_id`
- `code`
- `name`
- `status`
- `current_order_id`

### `wash_packages`

次卡与时间卡商品。

关键字段：

- `kind`
- `title`
- `subtitle`
- `price`
- `credits`
- `duration_days`
- `highlight`

### `recharge_offers`

储值方案。

关键字段：

- `amount`
- `bonus`
- `label`
- `highlighted`

### `recharge_records`

充值流水。

关键字段：

- `user_id`
- `offer_id`
- `amount`
- `bonus`
- `final_amount`

### `bookings`

预约记录。

关键字段：

- `user_id`
- `station_id`
- `device_id`
- `scheduled_at`
- `status`

### `orders`

洗车订单。

关键字段：

- `user_id`
- `station_id`
- `device_id`
- `status`
- `started_at`
- `ended_at`
- `duration_minutes`
- `amount`

### `notifications`

站内消息。

关键字段：

- `user_id`
- `type`
- `title`
- `content`
- `read`

### `feedback_tickets`

故障反馈和报修单。

关键字段：

- `user_id`
- `type`
- `description`
- `phone`
- `status`

### `feedback_attachments`

反馈附件元数据。

关键字段：

- `feedback_id`
- `name`
- `mime_type`

### `control_sessions`

设备实时控制会话。

关键字段：

- `user_id`
- `station_id`
- `device_id`
- `order_id`
- `active_mode`
- `is_paused`
- `duration_minutes`
- `amount`

### `verification_codes`

注册和找回密码验证码。

关键字段：

- `target`
- `scene`
- `method`
- `code`
- `expires_at`
- `consumed_at`

## 主要业务关系

- 一个 `app_users` 对应一个 `memberships`
- 一个 `memberships` 对应多个 `membership_benefits`
- 一个 `stations` 对应多个 `devices`
- 一个用户可拥有多个 `bookings`、`orders`、`recharge_records`、`notifications`
- 一个 `orders` 可对应一个 `control_sessions`
- 一个 `feedback_tickets` 可对应多个 `feedback_attachments`

## 已实现接口

### 认证

- `POST /api/auth/send-code`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/reset-password`
- `GET /api/auth/session`

### 用户与首页

- `GET /api/app/dashboard`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/membership`

### 门店、卡包、充值

- `GET /api/stations`
- `GET /api/stations/:stationId`
- `GET /api/packages`
- `POST /api/packages/purchase`
- `GET /api/recharges/offers`
- `GET /api/recharges/history`
- `POST /api/recharges`

### 预约、订单、通知

- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/orders`
- `GET /api/notifications`

### 反馈、设备控制

- `GET /api/feedback`
- `POST /api/feedback`
- `GET /api/control/session`
- `POST /api/control/start`
- `POST /api/control/mode`
- `POST /api/control/pause`
- `POST /api/control/resume`
- `POST /api/control/tick`
- `POST /api/control/checkout`

## 当前实现取舍

- 鉴权目前为后端自签 Bearer Token，不直接使用 Supabase Auth。
- `service_role key` 仅在 Express 服务端使用，浏览器端不暴露。
- 验证码接口是演示模式，便于本地联调，默认返回 `123456`。
- 头像目前以 URL 或 data URL 形式存储到数据库，后续可以继续升级为 Supabase Storage。
