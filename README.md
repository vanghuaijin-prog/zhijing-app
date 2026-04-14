<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 智净 24H

这是一个自助洗车 App 的前后端一体化项目：

- 前端：React + Vite
- 后端：Express
- 数据库：Supabase PostgreSQL

## 当前包含

- `src/`: 现有 React + Vite 前端页面
- `server/`: Express 后端、鉴权、Supabase 仓储层
- `supabase/schema.sql`: Supabase 建表与演示种子数据
- `docs/backend-data-structure.md`: 数据结构、表设计与接口说明
- `.env.example`: 后端和前端需要的环境变量模板

## 1. 配置 Supabase

1. 在 Supabase 创建一个新项目
2. 打开 SQL Editor
3. 执行 [supabase/schema.sql](/Users/wanghuaijin/Desktop/智净/supabase/schema.sql:1)

执行后会自动创建表结构、索引、更新时间触发器，以及一份演示数据。

## 2. 配置环境变量

复制 `.env.example` 为你本地的环境文件，并填入：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_JWT_SECRET`
- `VITE_API_BASE_URL`

注意：

- `SUPABASE_SERVICE_ROLE_KEY` 只给服务端用，前端不会直接暴露
- 前端默认通过 `Vite proxy` 或 `VITE_API_BASE_URL` 请求 Express 后端

## 演示账号

- 账号：`zhangzhijie`
- 手机号：`13800138000`
- 密码：`123456`

## 3. 本地运行

**Prerequisites:** Node.js 20+

1. 安装依赖
   `npm install`
2. 启动后端
   `npm run server`
3. 新开一个终端启动前端
   `npm run dev`

前端默认运行在 `http://127.0.0.1:3000`，`/api/*` 会代理到 `http://127.0.0.1:4000`。

## 当前已打通的能力

- 登录 / 注册 / 找回密码
- Bearer Token 登录态
- 用户资料修改
- 门店与设备状态
- 套餐购买、时间卡、余额充值
- 预约、订单、消息通知
- 设备控制、暂停、继续、结单
- 反馈与报修
- Supabase 持久化存储

## 关键接口

- `POST /api/auth/send-code`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/reset-password`
- `GET /api/auth/session`
- `GET /api/app/dashboard`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/stations`
- `GET /api/packages`
- `POST /api/packages/purchase`
- `GET /api/recharges/offers`
- `POST /api/recharges`
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/orders`
- `GET /api/notifications`
- `POST /api/feedback`
- `GET /api/control/session`
- `POST /api/control/start`
- `POST /api/control/mode`
- `POST /api/control/pause`
- `POST /api/control/resume`
- `POST /api/control/tick`
- `POST /api/control/checkout`

## 说明

- 现在的数据不再走内存仓库，而是走 Supabase 数据表。
- 浏览器只访问 Express API，`service_role key` 仅在服务端使用。
- 注册/找回密码中的验证码目前是演示模式，接口会返回调试验证码 `123456`，方便联调。
