import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { createAuthToken, parseAuthToken } from './lib/auth';
import { isServerConfigured, missingServerConfig, serverConfig } from './config';
import { repository } from './data/supabaseRepository';
import type { ControlMode, OrderStatus, VerificationMethod, VerificationScene } from './types';

type AuthedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const currentDir = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(currentDir, '../dist');
const app = express();

app.use(express.json({ limit: '8mb' }));
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  next();
});

app.options('*', (_, res) => {
  res.sendStatus(204);
});

const ok = (res: Response, data: unknown, message = 'ok') => {
  res.json({
    success: true,
    message,
    data,
  });
};

const fail = (res: Response, message: string, status = 400) => {
  res.status(status).json({
    success: false,
    message,
  });
};

const parseBody = <T extends Record<string, unknown>>(req: Request) => (req.body ?? {}) as T;

const requireConfigured = (res: Response) => {
  if (isServerConfigured) {
    return true;
  }

  fail(
    res,
    `服务端尚未配置 Supabase 环境变量，缺少：${missingServerConfig.join(', ')}`,
    500,
  );
  return false;
};

const authMiddleware = (req: AuthedRequest, res: Response, next: () => void) => {
  if (!requireConfigured(res)) {
    return;
  }

  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    fail(res, '缺少登录凭证。', 401);
    return;
  }

  const payload = parseAuthToken(header.slice('Bearer '.length));
  if (!payload) {
    fail(res, '登录凭证无效或已过期。', 401);
    return;
  }

  req.auth = { userId: payload.sub };
  next();
};

app.get('/api/health', (_, res) => {
  ok(res, {
    service: 'zhijing-backend',
    configured: isServerConfigured,
    missingConfig: missingServerConfig,
    now: new Date().toISOString(),
  });
});

app.post('/api/auth/send-code', async (req, res) => {
  if (!requireConfigured(res)) {
    return;
  }

  try {
    const body = parseBody<{
      target?: string;
      scene?: VerificationScene;
      method?: VerificationMethod;
    }>(req);

    if (!body.target || !body.scene || !body.method) {
      return fail(res, '请提供验证码接收目标、场景和方式。');
    }

    const result = await repository.sendVerificationCode({
      target: body.target,
      scene: body.scene,
      method: body.method,
    });

    return ok(res, result, '验证码已生成');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '发送验证码失败。');
  }
});

app.post('/api/auth/login', async (req, res) => {
  if (!requireConfigured(res)) {
    return;
  }

  try {
    const { account = '', password = '' } = parseBody<{ account?: string; password?: string }>(req);
    if (!account || !password) {
      return fail(res, '请输入账号和密码。');
    }

    const result = await repository.login(account, password);
    if (!result) {
      return fail(res, '账号或密码错误。', 401);
    }

    return ok(
      res,
      {
        token: createAuthToken({
          userId: result.user.id,
          username: result.user.username,
        }),
        user: result.user,
        membership: result.membership,
      },
      '登录成功',
    );
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '登录失败。');
  }
});

app.post('/api/auth/register', async (req, res) => {
  if (!requireConfigured(res)) {
    return;
  }

  try {
    const body = parseBody<{
      username?: string;
      phone?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      displayName?: string;
      agreementAccepted?: boolean;
      verificationCode?: string;
    }>(req);

    if (!body.username || !body.phone || !body.password || !body.verificationCode) {
      return fail(res, '注册信息不完整。');
    }
    if (body.password !== body.confirmPassword) {
      return fail(res, '两次输入的密码不一致。');
    }

    const result = await repository.register({
      username: body.username,
      phone: body.phone,
      email: body.email,
      password: body.password,
      displayName: body.displayName,
      agreementAccepted: Boolean(body.agreementAccepted),
      verificationCode: body.verificationCode,
    });

    return ok(
      res,
      {
        token: createAuthToken({
          userId: result.user.id,
          username: result.user.username,
        }),
        user: result.user,
        membership: result.membership,
      },
      '注册成功',
    );
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '注册失败。');
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  if (!requireConfigured(res)) {
    return;
  }

  try {
    const body = parseBody<{
      target?: string;
      method?: VerificationMethod;
      verificationCode?: string;
      newPassword?: string;
    }>(req);

    if (!body.target || !body.method || !body.verificationCode || !body.newPassword) {
      return fail(res, '重置密码所需参数不完整。');
    }

    await repository.resetPassword({
      target: body.target,
      method: body.method,
      verificationCode: body.verificationCode,
      newPassword: body.newPassword,
    });

    return ok(res, null, '密码已重置');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '重置密码失败。');
  }
});

app.get('/api/auth/session', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const result = await repository.getUserBundle(req.auth!.userId);
    return ok(res, result, 'session ready');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取会话失败。', 401);
  }
});

app.get('/api/app/dashboard', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getDashboard(req.auth!.userId));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取首页数据失败。', 500);
  }
});

app.get('/api/users/me', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getUserBundle(req.auth!.userId));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取用户信息失败。', 500);
  }
});

app.patch('/api/users/me', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const body = parseBody<{
      displayName?: string;
      avatar?: string;
      city?: string;
      district?: string;
    }>(req);
    const user = await repository.updateProfile(req.auth!.userId, body);
    return ok(res, { user }, '资料已更新');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '更新用户资料失败。');
  }
});

app.get('/api/membership', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const bundle = await repository.getUserBundle(req.auth!.userId);
    return ok(res, bundle.membership);
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取会员信息失败。');
  }
});

app.get('/api/stations', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const district = typeof req.query.district === 'string' ? req.query.district : undefined;
    return ok(res, await repository.listStations({ city, district }));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取门店失败。');
  }
});

app.get('/api/stations/:stationId', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getStationById(req.params.stationId));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取门店详情失败。', 404);
  }
});

app.get('/api/packages', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getPackages());
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取套餐失败。');
  }
});

app.post('/api/packages/purchase', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { packageId } = parseBody<{ packageId?: string }>(req);
    if (!packageId) {
      return fail(res, '缺少 packageId。');
    }
    return ok(res, await repository.purchasePackage(req.auth!.userId, packageId), '购买成功');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '购买套餐失败。');
  }
});

app.get('/api/recharges/offers', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getRechargeOffers());
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取充值方案失败。');
  }
});

app.get('/api/recharges/history', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getRechargeHistory(req.auth!.userId));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取充值记录失败。');
  }
});

app.post('/api/recharges', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { amount } = parseBody<{ amount?: number }>(req);
    if (!amount || amount <= 0) {
      return fail(res, '充值金额必须大于 0。');
    }
    return ok(res, await repository.createRecharge(req.auth!.userId, amount), '充值成功');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '充值失败。');
  }
});

app.get('/api/bookings', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getBookings(req.auth!.userId));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取预约列表失败。');
  }
});

app.post('/api/bookings', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const body = parseBody<{ stationId?: string; scheduledAt?: string; deviceId?: string }>(req);
    if (!body.stationId || !body.scheduledAt) {
      return fail(res, '预约参数不完整。');
    }
    return ok(
      res,
      await repository.createBooking(req.auth!.userId, {
        stationId: body.stationId,
        scheduledAt: body.scheduledAt,
        deviceId: body.deviceId,
      }),
      '预约成功',
    );
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '创建预约失败。');
  }
});

app.get('/api/orders', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const status =
      typeof req.query.status === 'string'
        ? (req.query.status as OrderStatus)
        : undefined;
    return ok(res, await repository.getOrders(req.auth!.userId, status));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取订单失败。');
  }
});

app.get('/api/notifications', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getNotifications(req.auth!.userId));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取通知失败。');
  }
});

app.get('/api/feedback', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getFeedbackTickets(req.auth!.userId));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取反馈记录失败。');
  }
});

app.post('/api/feedback', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const body = parseBody<{
      type?: string;
      description?: string;
      phone?: string;
      attachments?: string[];
    }>(req);

    if (!body.type || !body.description || !body.phone) {
      return fail(res, '反馈参数不完整。');
    }

    return ok(
      res,
      await repository.createFeedback(req.auth!.userId, {
        type: body.type,
        description: body.description,
        phone: body.phone,
        attachments: body.attachments ?? [],
      }),
      '反馈已提交',
    );
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '提交反馈失败。');
  }
});

app.get('/api/control/session', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.getControlSession(req.auth!.userId));
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '获取控制会话失败。');
  }
});

app.post('/api/control/start', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const body = parseBody<{ stationId?: string }>(req);
    return ok(
      res,
      await repository.startControlSession(req.auth!.userId, body.stationId),
      '设备已连接',
    );
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '启动设备会话失败。');
  }
});

app.post('/api/control/mode', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { mode } = parseBody<{ mode?: ControlMode }>(req);
    if (!mode) {
      return fail(res, '缺少控制模式。');
    }
    return ok(res, await repository.updateControlMode(req.auth!.userId, mode), '模式已更新');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '更新控制模式失败。');
  }
});

app.post('/api/control/pause', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.pauseControlSession(req.auth!.userId, true), '设备已暂停');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '暂停失败。');
  }
});

app.post('/api/control/resume', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.pauseControlSession(req.auth!.userId, false), '设备已继续');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '继续失败。');
  }
});

app.post('/api/control/tick', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.tickControlSession(req.auth!.userId), '设备状态已刷新');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '刷新设备状态失败。');
  }
});

app.post('/api/control/checkout', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    return ok(res, await repository.checkoutControlSession(req.auth!.userId), '订单已结单');
  } catch (error) {
    return fail(res, error instanceof Error ? error.message : '结单失败。');
  }
});

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(resolve(distDir, 'index.html'));
  });
}

app.listen(serverConfig.port, () => {
  console.log(
    `Zhijing backend listening on http://127.0.0.1:${serverConfig.port} (configured=${isServerConfigured})`,
  );
});
