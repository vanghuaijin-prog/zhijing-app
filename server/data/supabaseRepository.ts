import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from '../lib/auth';
import { getSupabaseAdmin } from '../lib/supabase';
import type {
  Booking,
  ControlMode,
  ControlSession,
  FeedbackAttachment,
  FeedbackTicket,
  LoginResult,
  Membership,
  MembershipBenefit,
  Notification,
  Order,
  OrderStatus,
  RechargeOffer,
  RechargeRecord,
  Station,
  User,
  VerificationMethod,
  VerificationScene,
  WashPackage,
} from '../types';

type Row = Record<string, unknown>;

const nowIso = () => new Date().toISOString();
const toMoney = (value: number) => Number(value.toFixed(2));
const isActiveFutureTime = (value: string | null) => Boolean(value && new Date(value).getTime() > Date.now());
const asRow = (value: unknown) => value as Row;
const asRows = (value: unknown[] | null | undefined) => (value ?? []) as Row[];

const mapUser = (row: Row): User => ({
  id: String(row.id),
  username: String(row.username),
  phone: String(row.phone),
  email: (row.email as string | null) ?? null,
  displayName: String(row.display_name),
  avatar: String(row.avatar_url || ''),
  city: String(row.city || '深圳市'),
  district: String(row.district || '南山区'),
  memberSince: String(row.member_since || row.created_at || nowIso()),
  walletBalance: Number(row.wallet_balance || 0),
  washCredits: Number(row.wash_credits || 0),
  agreementAccepted: Boolean(row.agreement_accepted),
  defaultStationId: (row.default_station_id as string | null) ?? null,
  timeCardExpiresAt: (row.time_card_expires_at as string | null) ?? null,
});

const mapMembershipBenefit = (row: Row): MembershipBenefit => ({
  id: String(row.id),
  title: String(row.title),
  description: String(row.description || ''),
  icon: String(row.icon || 'stars'),
  sortOrder: Number(row.sort_order || 0),
});

const mapMembership = (
  row: Row,
  benefits: MembershipBenefit[],
): Membership => ({
  userId: String(row.user_id),
  tier: row.tier as Membership['tier'],
  label: String(row.label),
  growthValue: Number(row.growth_value || 0),
  nextTierGrowthValue: Number(row.next_tier_growth_value || 0),
  benefits,
});

const mapStationRow = (
  row: Row,
  devices: Row[],
): Station => ({
  id: String(row.id),
  name: String(row.name),
  city: String(row.city),
  district: String(row.district),
  address: String(row.address),
  latitude: Number(row.latitude || 0),
  longitude: Number(row.longitude || 0),
  distanceKm: Number(row.distance_km || 0),
  tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
  availableDevices: devices.filter((device) => device.status === 'idle').length,
  totalDevices: devices.length,
});

const mapPackage = (row: Row): WashPackage => ({
  id: String(row.id),
  kind: row.kind as WashPackage['kind'],
  title: String(row.title),
  subtitle: String(row.subtitle || ''),
  price: Number(row.price || 0),
  originalPrice: row.original_price === null ? null : Number(row.original_price || 0),
  credits: row.credits === null ? null : Number(row.credits || 0),
  durationDays: row.duration_days === null ? null : Number(row.duration_days || 0),
  highlight: (row.highlight as string | null) ?? null,
});

const mapRechargeOffer = (row: Row): RechargeOffer => ({
  id: String(row.id),
  kind: row.kind as RechargeOffer['kind'],
  amount: Number(row.amount || 0),
  bonus: Number(row.bonus || 0),
  label: String(row.label),
  highlighted: Boolean(row.highlighted),
});

const mapRechargeRecord = (row: Row): RechargeRecord => ({
  id: String(row.id),
  userId: String(row.user_id),
  amount: Number(row.amount || 0),
  bonus: Number(row.bonus || 0),
  finalAmount: Number(row.final_amount || 0),
  createdAt: String(row.created_at),
});

const mapNotification = (row: Row): Notification => ({
  id: String(row.id),
  userId: String(row.user_id),
  type: row.type as Notification['type'],
  title: String(row.title),
  content: String(row.content),
  createdAt: String(row.created_at),
  read: Boolean(row.read),
});

const mapFeedbackAttachment = (row: Row): FeedbackAttachment => ({
  id: String(row.id),
  feedbackId: String(row.feedback_id),
  name: String(row.name),
  mimeType: String(row.mime_type || 'external'),
});

const maybeSingle = async <T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) => {
  const { data, error } = await promise;
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const mustSingle = async <T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>, notFoundMessage: string) => {
  const data = await maybeSingle(promise);
  if (!data) {
    throw new Error(notFoundMessage);
  }
  return data;
};

const listDevicesByStationIds = async (stationIds: string[]) => {
  if (stationIds.length === 0) {
    return [] as Row[];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('devices').select('*').in('station_id', stationIds);
  if (error) {
    throw new Error(error.message);
  }
  return asRows(data);
};

const findUserByAccount = async (account: string) => {
  const supabase = getSupabaseAdmin();
  const byUsername = await maybeSingle(
    supabase.from('app_users').select('*').eq('username', account).maybeSingle(),
  );
  if (byUsername) {
    return asRow(byUsername);
  }

  const byPhone = await maybeSingle(
    supabase.from('app_users').select('*').eq('phone', account).maybeSingle(),
  );
  if (byPhone) {
    return asRow(byPhone);
  }

  const byEmail = await maybeSingle(
    supabase.from('app_users').select('*').eq('email', account).maybeSingle(),
  );
  return byEmail ? asRow(byEmail) : null;
};

const findUserByTarget = async (target: string, method: VerificationMethod) => {
  const supabase = getSupabaseAdmin();
  const column = method === 'phone' ? 'phone' : 'email';
  return maybeSingle(supabase.from('app_users').select('*').eq(column, target).maybeSingle());
};

const getMembership = async (userId: string) => {
  const supabase = getSupabaseAdmin();
  const membershipRow = await maybeSingle(
    supabase.from('memberships').select('*').eq('user_id', userId).maybeSingle(),
  );
  if (!membershipRow) {
    return null;
  }

  const { data: benefitRows, error } = await supabase
    .from('membership_benefits')
    .select('*')
    .eq('membership_user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return mapMembership(
    asRow(membershipRow),
    asRows(benefitRows).map((row) => mapMembershipBenefit(row)),
  );
};

const getUser = async (userId: string) => {
  const supabase = getSupabaseAdmin();
  const row = await mustSingle(
    supabase.from('app_users').select('*').eq('id', userId).maybeSingle(),
    '用户不存在。',
  );
  return mapUser(asRow(row));
};

const getStationRecord = async (stationId: string) =>
  mustSingle(
    getSupabaseAdmin().from('stations').select('*').eq('id', stationId).maybeSingle(),
    '门店不存在。',
  );

const getDeviceRecord = async (deviceId: string) =>
  mustSingle(
    getSupabaseAdmin().from('devices').select('*').eq('id', deviceId).maybeSingle(),
    '设备不存在。',
  );

const enrichOrders = async (rows: Row[]) => {
  const stationIds = [...new Set(rows.map((row) => String(row.station_id)))];
  const deviceIds = [...new Set(rows.map((row) => String(row.device_id)))];
  const supabase = getSupabaseAdmin();

  const [{ data: stations, error: stationsError }, { data: devices, error: devicesError }] =
    await Promise.all([
      stationIds.length
        ? supabase.from('stations').select('*').in('id', stationIds)
        : Promise.resolve({ data: [], error: null }),
      deviceIds.length
        ? supabase.from('devices').select('*').in('id', deviceIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (stationsError) {
    throw new Error(stationsError.message);
  }
  if (devicesError) {
    throw new Error(devicesError.message);
  }

  const stationMap = new Map(asRows(stations).map((row) => [String(row.id), row]));
  const deviceMap = new Map(asRows(devices).map((row) => [String(row.id), row]));

  return rows.map((row) => {
    const station = stationMap.get(String(row.station_id));
    const device = deviceMap.get(String(row.device_id));
    return {
      id: String(row.id),
      userId: String(row.user_id),
      stationId: String(row.station_id),
      stationName: String(station?.name || '未知门店'),
      deviceId: String(row.device_id),
      deviceCode: String(device?.code || ''),
      deviceName: String(device?.name || '智能洗车机'),
      status: row.status as OrderStatus,
      startedAt: String(row.started_at),
      endedAt: (row.ended_at as string | null) ?? null,
      durationMinutes: Number(row.duration_minutes || 0),
      amount: Number(row.amount || 0),
    } satisfies Order;
  });
};

const enrichBookings = async (rows: Row[]) => {
  const stationIds = [...new Set(rows.map((row) => String(row.station_id)))];
  const deviceIds = [...new Set(rows.map((row) => String(row.device_id)))];
  const supabase = getSupabaseAdmin();

  const [{ data: stations, error: stationsError }, { data: devices, error: devicesError }] =
    await Promise.all([
      stationIds.length
        ? supabase.from('stations').select('*').in('id', stationIds)
        : Promise.resolve({ data: [], error: null }),
      deviceIds.length
        ? supabase.from('devices').select('*').in('id', deviceIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (stationsError) {
    throw new Error(stationsError.message);
  }
  if (devicesError) {
    throw new Error(devicesError.message);
  }

  const stationMap = new Map(asRows(stations).map((row) => [String(row.id), row]));
  const deviceMap = new Map(asRows(devices).map((row) => [String(row.id), row]));

  return rows.map((row) => {
    const station = stationMap.get(String(row.station_id));
    const device = deviceMap.get(String(row.device_id));
    return {
      id: String(row.id),
      userId: String(row.user_id),
      stationId: String(row.station_id),
      stationName: `智净24H ${String(station?.name || '门店')}`,
      deviceId: String(row.device_id),
      deviceCode: String(device?.code || ''),
      deviceName: String(device?.name || '智能洗车机'),
      scheduledAt: String(row.scheduled_at),
      status: row.status as Booking['status'],
      createdAt: String(row.created_at),
    } satisfies Booking;
  });
};

const getOpenControlSessionRow = async (userId: string) =>
  maybeSingle(
    getSupabaseAdmin()
      .from('control_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  );

const mapControlSession = async (row: Row): Promise<ControlSession> => {
  const [stationRow, deviceRow] = await Promise.all([
    getStationRecord(String(row.station_id)),
    getDeviceRecord(String(row.device_id)),
  ]);

  return {
    id: String(row.id),
    userId: String(row.user_id),
    stationId: String(row.station_id),
    stationName: `智净24H ${String(asRow(stationRow).name || '门店')}`,
    deviceId: String(row.device_id),
    deviceCode: String(asRow(deviceRow).code || ''),
    orderId: String(row.order_id),
    activeMode: (row.active_mode as ControlSession['activeMode']) ?? null,
    isPaused: Boolean(row.is_paused),
    durationMinutes: Number(row.duration_minutes || 0),
    amount: Number(row.amount || 0),
  };
};

const createNotification = async (
  userId: string,
  title: string,
  content: string,
  type: Notification['type'] = 'system',
) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('notifications').insert({
    id: randomUUID(),
    user_id: userId,
    type,
    title,
    content,
    created_at: nowIso(),
    read: false,
  });

  if (error) {
    throw new Error(error.message);
  }
};

const updateMembershipGrowth = async (userId: string, delta: number) => {
  const supabase = getSupabaseAdmin();
  const membershipRow = await maybeSingle(
    supabase.from('memberships').select('*').eq('user_id', userId).maybeSingle(),
  );
  if (!membershipRow) {
    return;
  }

  const membership = asRow(membershipRow);
  const currentGrowth = Number(membership.growth_value || 0) + delta;
  let tier = membership.tier as Membership['tier'];
  let label = String(membership.label || '银卡会员');
  let nextTierGrowthValue = Number(membership.next_tier_growth_value || 1000);

  if (currentGrowth >= 3000) {
    tier = 'platinum';
    label = '铂金会员';
    nextTierGrowthValue = 5000;
  } else if (currentGrowth >= 1000) {
    tier = 'gold';
    label = '金卡会员';
    nextTierGrowthValue = 3000;
  } else {
    tier = 'silver';
    label = '银卡会员';
    nextTierGrowthValue = 1000;
  }

  const { error } = await supabase
    .from('memberships')
    .update({
      tier,
      label,
      growth_value: currentGrowth,
      next_tier_growth_value: nextTierGrowthValue,
      updated_at: nowIso(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
};

export const repository = {
  async getUserBundle(userId: string) {
    const [user, membership] = await Promise.all([getUser(userId), getMembership(userId)]);
    return { user, membership };
  },

  async login(account: string, password: string): Promise<LoginResult | null> {
    const userRow = await findUserByAccount(account);
    if (!userRow) {
      return null;
    }

    if (!verifyPassword(password, String(userRow.password_hash || ''))) {
      return null;
    }

    const user = mapUser(userRow);
    const membership = await getMembership(user.id);
    return { token: '', user, membership };
  },

  async sendVerificationCode(input: {
    target: string;
    scene: VerificationScene;
    method: VerificationMethod;
  }) {
    const supabase = getSupabaseAdmin();
    const code = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const row = {
      id: randomUUID(),
      target: input.target,
      scene: input.scene,
      method: input.method,
      code,
      expires_at: expiresAt,
      consumed_at: null,
      created_at: nowIso(),
    };

    const { error } = await supabase.from('verification_codes').insert(row);
    if (error) {
      throw new Error(error.message);
    }

    return {
      expiresAt,
      debugCode: code,
    };
  },

  async verifyCode(input: {
    target: string;
    scene: VerificationScene;
    method: VerificationMethod;
    code: string;
  }) {
    const supabase = getSupabaseAdmin();
    const row = await maybeSingle(
      supabase
        .from('verification_codes')
        .select('*')
        .eq('target', input.target)
        .eq('scene', input.scene)
        .eq('method', input.method)
        .eq('code', input.code)
        .is('consumed_at', null)
        .gt('expires_at', nowIso())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (!row) {
      throw new Error('验证码无效或已过期。');
    }

    const { error } = await supabase
      .from('verification_codes')
      .update({ consumed_at: nowIso() })
      .eq('id', asRow(row).id);

    if (error) {
      throw new Error(error.message);
    }
  },

  async register(input: {
    username: string;
    phone: string;
    email?: string;
    password: string;
    displayName?: string;
    agreementAccepted: boolean;
    verificationCode: string;
  }) {
    await this.verifyCode({
      target: input.phone,
      scene: 'register',
      method: 'phone',
      code: input.verificationCode,
    });

    const supabase = getSupabaseAdmin();
    const existingUser = await findUserByAccount(input.username);
    if (existingUser) {
      throw new Error('用户名已存在。');
    }

    const existingPhone = await maybeSingle(
      supabase.from('app_users').select('*').eq('phone', input.phone).maybeSingle(),
    );
    if (existingPhone) {
      throw new Error('手机号已存在。');
    }

    const defaultStation = await maybeSingle(
      supabase.from('stations').select('*').order('distance_km', { ascending: true }).limit(1).maybeSingle(),
    );

    const userId = randomUUID();
    const insertUser = {
      id: userId,
      username: input.username,
      phone: input.phone,
      email: input.email || null,
      password_hash: hashPassword(input.password),
      display_name: input.displayName || input.username,
      avatar_url:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      city: '深圳市',
      district: '南山区',
      member_since: nowIso(),
      wallet_balance: 0,
      wash_credits: 1,
      agreement_accepted: input.agreementAccepted,
      default_station_id: defaultStation ? asRow(defaultStation).id : null,
      time_card_expires_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    const { error: userError } = await supabase.from('app_users').insert(insertUser);
    if (userError) {
      throw new Error(userError.message);
    }

    const { error: membershipError } = await supabase.from('memberships').insert({
      user_id: userId,
      tier: 'silver',
      label: '银卡会员',
      growth_value: 0,
      next_tier_growth_value: 1000,
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    const { error: benefitError } = await supabase.from('membership_benefits').insert({
      id: randomUUID(),
      membership_user_id: userId,
      title: '新人礼包',
      description: '注册即送 1 次洗车体验次数。',
      icon: 'card_giftcard',
      sort_order: 1,
      created_at: nowIso(),
    });

    if (benefitError) {
      throw new Error(benefitError.message);
    }

    await createNotification(
      userId,
      '欢迎加入智净24H',
      '您的账号已创建成功，并已领取新人体验次数 1 次。',
      'system',
    );

    return this.getUserBundle(userId);
  },

  async resetPassword(input: {
    target: string;
    method: VerificationMethod;
    verificationCode: string;
    newPassword: string;
  }) {
    await this.verifyCode({
      target: input.target,
      scene: 'reset_password',
      method: input.method,
      code: input.verificationCode,
    });

    const userRow = await findUserByTarget(input.target, input.method);
    if (!userRow) {
      throw new Error('账号不存在。');
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('app_users')
      .update({
        password_hash: hashPassword(input.newPassword),
        updated_at: nowIso(),
      })
      .eq('id', asRow(userRow).id);

    if (error) {
      throw new Error(error.message);
    }

    await createNotification(String(asRow(userRow).id), '密码已重置', '您的登录密码已成功更新。', 'system');
  },

  async updateProfile(
    userId: string,
    input: Partial<Pick<User, 'displayName' | 'avatar' | 'city' | 'district'>>,
  ) {
    const supabase = getSupabaseAdmin();
    const payload: Record<string, unknown> = {
      updated_at: nowIso(),
    };

    if (typeof input.displayName === 'string') {
      payload.display_name = input.displayName;
    }
    if (typeof input.avatar === 'string') {
      payload.avatar_url = input.avatar;
    }
    if (typeof input.city === 'string') {
      payload.city = input.city;
    }
    if (typeof input.district === 'string') {
      payload.district = input.district;
    }

    const { error } = await supabase.from('app_users').update(payload).eq('id', userId);
    if (error) {
      throw new Error(error.message);
    }

    return getUser(userId);
  },

  async listStations(filters?: { city?: string; district?: string }) {
    const supabase = getSupabaseAdmin();
    let query = supabase.from('stations').select('*').order('distance_km', { ascending: true });
    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    if (filters?.district) {
      query = query.eq('district', filters.district);
    }

    const { data: stations, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const stationRows = asRows(stations);
    const devices = await listDevicesByStationIds(stationRows.map((row) => String(row.id)));

    return stationRows.map((stationRow) =>
      mapStationRow(
        stationRow,
        devices.filter((device) => device.station_id === stationRow.id),
      ),
    );
  },

  async getStationById(stationId: string) {
    const stationRow = await getStationRecord(stationId);
    const devices = await listDevicesByStationIds([stationId]);
    return mapStationRow(asRow(stationRow), devices);
  },

  async getPackages() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('wash_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return asRows(data).map((row) => mapPackage(row));
  },

  async purchasePackage(userId: string, packageId: string) {
    const supabase = getSupabaseAdmin();
    const user = await getUser(userId);
    const packageRow = await mustSingle(
      supabase.from('wash_packages').select('*').eq('id', packageId).maybeSingle(),
      '套餐不存在。',
    );
    const item = mapPackage(asRow(packageRow));

    if (item.kind === 'wash_card') {
      const nextCredits = user.washCredits + Number(item.credits || 0);
      const { error } = await supabase
        .from('app_users')
        .update({
          wash_credits: nextCredits,
          updated_at: nowIso(),
        })
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const baseDate = isActiveFutureTime(user.timeCardExpiresAt)
        ? new Date(user.timeCardExpiresAt as string)
        : new Date();
      baseDate.setDate(baseDate.getDate() + Number(item.durationDays || 0));

      const { error } = await supabase
        .from('app_users')
        .update({
          time_card_expires_at: baseDate.toISOString(),
          updated_at: nowIso(),
        })
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }
    }

    await updateMembershipGrowth(userId, Math.round(item.price));
    await createNotification(
      userId,
      '卡包购买成功',
      `您已成功购买 ${item.title}，权益已发放到账号中。`,
      'promotion',
    );

    return {
      package: item,
      user: await getUser(userId),
    };
  },

  async getRechargeOffers() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('recharge_offers')
      .select('*')
      .eq('is_active', true)
      .order('amount', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRechargeOffer(row as Record<string, unknown>));
  },

  async getRechargeHistory(userId: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('recharge_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapRechargeRecord(row as Record<string, unknown>));
  },

  async createRecharge(userId: string, amount: number) {
    const supabase = getSupabaseAdmin();
    const user = await getUser(userId);
    const offerRow = await maybeSingle(
      supabase.from('recharge_offers').select('*').eq('amount', amount).maybeSingle(),
    );
    const offer = offerRow ? mapRechargeOffer(asRow(offerRow)) : null;
    const bonus = offer?.bonus ?? 0;
    const finalAmount = amount + bonus;

    const { error: recordError } = await supabase.from('recharge_records').insert({
      id: randomUUID(),
      user_id: userId,
      offer_id: offer?.id ?? null,
      amount,
      bonus,
      final_amount: finalAmount,
      created_at: nowIso(),
    });

    if (recordError) {
      throw new Error(recordError.message);
    }

    const { error: userError } = await supabase
      .from('app_users')
      .update({
        wallet_balance: toMoney(user.walletBalance + finalAmount),
        updated_at: nowIso(),
      })
      .eq('id', userId);

    if (userError) {
      throw new Error(userError.message);
    }

    await updateMembershipGrowth(userId, Math.round(finalAmount / 2));
    await createNotification(
      userId,
      '充值成功',
      `已到账 ¥${finalAmount.toFixed(2)}，其中赠送 ¥${bonus.toFixed(2)}。`,
      'promotion',
    );

    return {
      balance: toMoney(user.walletBalance + finalAmount),
      offer,
    };
  },

  async getBookings(userId: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return enrichBookings(asRows(data));
  },

  async createBooking(userId: string, input: { stationId: string; scheduledAt: string; deviceId?: string }) {
    const supabase = getSupabaseAdmin();
    const stationRow = await getStationRecord(input.stationId);
    const stationName = String(asRow(stationRow).name);
    let deviceRow: Row;

    if (input.deviceId) {
      const found = await getDeviceRecord(input.deviceId);
      if (asRow(found).station_id !== input.stationId) {
        throw new Error('设备不属于当前门店。');
      }
      if (asRow(found).status !== 'idle') {
        throw new Error('当前设备不可预约。');
      }
      deviceRow = asRow(found);
    } else {
      deviceRow = await mustSingle(
        supabase
          .from('devices')
          .select('*')
          .eq('station_id', input.stationId)
          .eq('status', 'idle')
        .order('code', { ascending: true })
        .limit(1)
        .maybeSingle(),
        '当前没有可预约设备。',
      ).then(asRow);
    }

    const bookingId = randomUUID();
    const { error: bookingError } = await supabase.from('bookings').insert({
      id: bookingId,
      user_id: userId,
      station_id: input.stationId,
      device_id: deviceRow.id,
      scheduled_at: input.scheduledAt,
      status: 'upcoming',
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    if (bookingError) {
      throw new Error(bookingError.message);
    }

    const { error: deviceError } = await supabase
      .from('devices')
      .update({
        status: 'reserved',
        updated_at: nowIso(),
      })
      .eq('id', deviceRow.id);

    if (deviceError) {
      throw new Error(deviceError.message);
    }

    await createNotification(
      userId,
      '预约成功',
      `您已预约 ${stationName} ${String(deviceRow.code)} 设备，请准时到店。`,
      'system',
    );

    const bookings = await this.getBookings(userId);
    return bookings.find((item) => item.id === bookingId) ?? bookings[0];
  },

  async getOrders(userId: string, status?: OrderStatus) {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return enrichOrders(asRows(data));
  },

  async getNotifications(userId: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapNotification(row as Record<string, unknown>));
  },

  async getFeedbackTickets(userId: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('feedback_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    const ids = rows.map((row) => String(row.id));
    const { data: attachmentRows, error: attachmentError } = ids.length
      ? await supabase.from('feedback_attachments').select('*').in('feedback_id', ids)
      : { data: [], error: null };

    if (attachmentError) {
      throw new Error(attachmentError.message);
    }

    const attachmentMap = new Map<string, FeedbackAttachment[]>();
    (attachmentRows ?? []).forEach((row) => {
      const attachment = mapFeedbackAttachment(asRow(row));
      attachmentMap.set(attachment.feedbackId, [
        ...(attachmentMap.get(attachment.feedbackId) ?? []),
        attachment,
      ]);
    });

    return rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      type: String(row.type),
      description: String(row.description),
      phone: String(row.phone),
      status: row.status as FeedbackTicket['status'],
      attachments: attachmentMap.get(String(row.id)) ?? [],
      createdAt: String(row.created_at),
    }));
  },

  async createFeedback(
    userId: string,
    input: { type: string; description: string; phone: string; attachments: string[] },
  ) {
    const supabase = getSupabaseAdmin();
    const feedbackId = randomUUID();
    const { error } = await supabase.from('feedback_tickets').insert({
      id: feedbackId,
      user_id: userId,
      type: input.type,
      description: input.description,
      phone: input.phone,
      status: 'submitted',
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    if (error) {
      throw new Error(error.message);
    }

    if (input.attachments.length > 0) {
      const attachmentRows = input.attachments.map((name) => ({
        id: randomUUID(),
        feedback_id: feedbackId,
        name,
        mime_type: 'external',
        created_at: nowIso(),
      }));
      const { error: attachmentError } = await supabase.from('feedback_attachments').insert(attachmentRows);
      if (attachmentError) {
        throw new Error(attachmentError.message);
      }
    }

    await createNotification(
      userId,
      '反馈已提交',
      '您的报修/反馈已提交成功，运维团队会尽快处理。',
      'system',
    );

    const tickets = await this.getFeedbackTickets(userId);
    return tickets.find((item) => item.id === feedbackId) ?? tickets[0];
  },

  async getControlSession(userId: string) {
    const row = await getOpenControlSessionRow(userId);
    if (!row) {
      return null;
    }
    return mapControlSession(asRow(row));
  },

  async startControlSession(userId: string, stationId?: string) {
    const existing = await getOpenControlSessionRow(userId);
    if (existing) {
      return mapControlSession(asRow(existing));
    }

    const user = await getUser(userId);
    const targetStationId = stationId || user.defaultStationId;
    if (!targetStationId) {
      throw new Error('当前账号未配置默认门店。');
    }

    const supabase = getSupabaseAdmin();
    const stationRow = await getStationRecord(targetStationId);
    const deviceRow = await mustSingle(
      supabase
        .from('devices')
        .select('*')
        .eq('station_id', targetStationId)
        .eq('status', 'idle')
        .order('code', { ascending: true })
        .limit(1)
        .maybeSingle(),
      '当前没有可用设备，请稍后再试。',
    ).then(asRow);

    const orderId = randomUUID();
    const sessionId = randomUUID();
    const startedAt = nowIso();
    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      user_id: userId,
      station_id: targetStationId,
      device_id: deviceRow.id,
      status: 'in_progress',
      started_at: startedAt,
      ended_at: null,
      duration_minutes: 0,
      amount: 0,
      created_at: startedAt,
      updated_at: startedAt,
    });

    if (orderError) {
      throw new Error(orderError.message);
    }

    const { error: deviceError } = await supabase
      .from('devices')
      .update({
        status: 'busy',
        current_order_id: orderId,
        updated_at: nowIso(),
      })
      .eq('id', deviceRow.id);

    if (deviceError) {
      throw new Error(deviceError.message);
    }

    const { error: sessionError } = await supabase.from('control_sessions').insert({
      id: sessionId,
      user_id: userId,
      station_id: targetStationId,
      device_id: deviceRow.id,
      order_id: orderId,
      active_mode: 'water',
      is_paused: false,
      duration_minutes: 0,
      amount: 0,
      created_at: startedAt,
      updated_at: startedAt,
    });

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    await createNotification(
      userId,
      '设备已连接',
      `您已连接 ${String(asRow(stationRow).name)} ${String(deviceRow.code)} 设备。`,
      'system',
    );

    return mapControlSession({
      id: sessionId,
      user_id: userId,
      station_id: targetStationId,
      device_id: deviceRow.id,
      order_id: orderId,
      active_mode: 'water',
      is_paused: false,
      duration_minutes: 0,
      amount: 0,
    });
  },

  async updateControlMode(userId: string, mode: ControlMode) {
    const supabase = getSupabaseAdmin();
    const row = await mustSingle(
      supabase
        .from('control_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      '当前没有进行中的设备会话。',
    );

    const { error } = await supabase
      .from('control_sessions')
      .update({
        active_mode: mode,
        is_paused: false,
        updated_at: nowIso(),
      })
      .eq('id', asRow(row).id);

    if (error) {
      throw new Error(error.message);
    }

    return this.getControlSession(userId);
  },

  async pauseControlSession(userId: string, isPaused: boolean) {
    const supabase = getSupabaseAdmin();
    const row = await mustSingle(
      supabase
        .from('control_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      '当前没有进行中的设备会话。',
    );

    const { error } = await supabase
      .from('control_sessions')
      .update({
        is_paused: isPaused,
        active_mode: isPaused ? null : asRow(row).active_mode || 'water',
        updated_at: nowIso(),
      })
      .eq('id', asRow(row).id);

    if (error) {
      throw new Error(error.message);
    }

    return this.getControlSession(userId);
  },

  async tickControlSession(userId: string) {
    const supabase = getSupabaseAdmin();
    const row = await mustSingle(
      supabase
        .from('control_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      '当前没有进行中的设备会话。',
    );

    const session = asRow(row);
    if (session.is_paused) {
      return mapControlSession(session);
    }

    const nextDuration = Number(session.duration_minutes || 0) + 1;
    const nextAmount = toMoney(Number(session.amount || 0) + 0.5);

    const [{ error: sessionError }, { error: orderError }] = await Promise.all([
      supabase
        .from('control_sessions')
        .update({
          duration_minutes: nextDuration,
          amount: nextAmount,
          updated_at: nowIso(),
        })
        .eq('id', session.id),
      supabase
        .from('orders')
        .update({
          duration_minutes: nextDuration,
          amount: nextAmount,
          updated_at: nowIso(),
        })
        .eq('id', session.order_id),
    ]);

    if (sessionError) {
      throw new Error(sessionError.message);
    }
    if (orderError) {
      throw new Error(orderError.message);
    }

    return this.getControlSession(userId);
  },

  async checkoutControlSession(userId: string) {
    const supabase = getSupabaseAdmin();
    const sessionRow = await mustSingle(
      supabase
        .from('control_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      '当前没有进行中的设备会话。',
    );

    const user = await getUser(userId);
    const session = asRow(sessionRow);
    const amount = Number(session.amount || 0);

    let nextWalletBalance = user.walletBalance;
    let nextWashCredits = user.washCredits;
    const updateUserPayload: Record<string, unknown> = { updated_at: nowIso() };

    if (isActiveFutureTime(user.timeCardExpiresAt)) {
      // Time card active: no wallet deduction.
    } else if (user.washCredits > 0) {
      nextWashCredits -= 1;
      updateUserPayload.wash_credits = nextWashCredits;
    } else {
      nextWalletBalance = toMoney(Math.max(0, user.walletBalance - amount));
      updateUserPayload.wallet_balance = nextWalletBalance;
    }

    const [{ error: userError }, { error: orderError }, { error: deviceError }, { error: sessionError }] =
      await Promise.all([
        Object.keys(updateUserPayload).length > 1
          ? supabase.from('app_users').update(updateUserPayload).eq('id', userId)
          : Promise.resolve({ error: null }),
        supabase
          .from('orders')
          .update({
            status: 'completed',
            ended_at: nowIso(),
            updated_at: nowIso(),
          })
          .eq('id', session.order_id),
        supabase
          .from('devices')
          .update({
            status: 'idle',
            current_order_id: null,
            updated_at: nowIso(),
          })
          .eq('id', session.device_id),
        supabase.from('control_sessions').delete().eq('id', session.id),
      ]);

    if (userError) {
      throw new Error(userError.message);
    }
    if (orderError) {
      throw new Error(orderError.message);
    }
    if (deviceError) {
      throw new Error(deviceError.message);
    }
    if (sessionError) {
      throw new Error(sessionError.message);
    }

    await updateMembershipGrowth(userId, Math.round(amount));
    await createNotification(
      userId,
      '订单完成',
      `您本次洗车订单已完成，订单金额为 ¥${amount.toFixed(2)}。`,
      'order',
    );

    const orders = await this.getOrders(userId);
    return orders.find((item) => item.id === String(session.order_id)) ?? orders[0];
  },

  async getDashboard(userId: string) {
    const [bundle, stations, notifications, controlSession, orders, bookings] = await Promise.all([
      this.getUserBundle(userId),
      this.listStations(),
      this.getNotifications(userId),
      this.getControlSession(userId),
      this.getOrders(userId),
      this.getBookings(userId),
    ]);

    return {
      ...bundle,
      stations,
      notifications,
      controlSession,
      orders,
      bookings,
    };
  },
};
