"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { getSchedulePrice, scheduleToFormula, validatePricingConfig, type PricingConfig, type PriceSchedule } from "@/lib/pricing-config";
import { getFormulaIssue } from "@/lib/pricing-formula";
import styles from "./admin-panel.module.css";

const OWNER_EMAIL = "a230495k@gmail.com";
const money = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
type Snapshot = { config: PricingConfig; revision: number; updatedAt: string | null };
type HistoryEntry = { id: number; createdAt: string; actor: string; revision: number; config: PricingConfig };
type Session = { authenticated: boolean; configured: boolean; initialized: boolean; email?: string; snapshot?: Snapshot; history?: HistoryEntry[] };
type ModuleId = "base" | "menu" | "onsite" | "itAdministration";
type Draft = Record<ModuleId, string>;
type PreservedDraft = { draft: Draft; revision: number };
type FormulaValidation = { draft: Draft; issues: Record<ModuleId, string | null> };
const previewRows = [[1, 6], [2, 7], [3, 8], [4, 10], [5, 15]] as const;

const modules: { id: ModuleId; tab: string; title: string; description: string }[] = [
  { id: "base", tab: "r_keeper", title: "Удалённое сопровождение r_keeper", description: "Ежемесячная стоимость основного пакета сопровождения." },
  { id: "menu", tab: "Меню и словари", title: "Меню и словари r_keeper", description: "Ежемесячная стоимость работы с меню и словарями." },
  { id: "onsite", tab: "Выездное сопровождение", title: "Выездное аппаратно-техническое сопровождение", description: "Ежемесячная стоимость пакета в городах, где доступен выезд." },
  { id: "itAdministration", tab: "IT-администрирование", title: "IT-администрирование", description: "Отдельный пакет обслуживания IT-инфраструктуры." },
];

class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.", 0);
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(typeof result?.error === "string" ? result.error : "Не удалось выполнить действие. Попробуйте ещё раз.", response.status);
  }
  if (!result) throw new ApiError("Сервер не ответил. Попробуйте ещё раз.", response.status);
  return result as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Что-то пошло не так. Попробуйте ещё раз.";
}

function schedule(config: PricingConfig, id: ModuleId): PriceSchedule {
  return id === "itAdministration" ? config.itAdministration : config.rkeeper[id];
}

function toDraft(config: PricingConfig): Draft {
  return Object.fromEntries(modules.map(({ id }) => [id, scheduleToFormula(schedule(config, id))])) as Draft;
}

function fromDraft(draft: Draft): PricingConfig {
  return {
    rkeeper: { base: { formula: draft.base }, menu: { formula: draft.menu }, onsite: { formula: draft.onsite } },
    itAdministration: { formula: draft.itAdministration },
  };
}

function dateLabel(value: string | null) {
  if (!value) return "Исходный прайс";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function Arrow() {
  return <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ErrorNotice({ children, id }: { children: React.ReactNode; id?: string }) {
  return <p className={styles.error} role="alert" id={id}>{children}</p>;
}

function LoginForm({ email, onSuccess, notice }: { email: string; onSuccess: () => Promise<void>; notice?: string }) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", "POST", { email, password, code: code.trim(), recovery });
      setPassword("");
      setCode("");
      await onSuccess();
    } catch (failure) {
      setError(errorMessage(failure));
      setCode("");
    } finally { setBusy(false); }
  }

  return <section className={styles.authCard} aria-labelledby="login-title">
    <span className={styles.eyebrow}>Управление сайтом</span>
    <h1 id="login-title">Войти в кабинет</h1>
    <p className={styles.intro}>Прайс и история изменений — в одном месте.</p>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <form onSubmit={login} className={styles.form} aria-busy={busy}>
      <fieldset disabled={busy}>
        <label className={styles.field}><span>Почта</span><input type="email" name="email" autoComplete="username" value={email} readOnly /></label>
        <label className={styles.field}><span>Пароль</span><input type="password" name="password" autoComplete="current-password" maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className={styles.field}><span>{recovery ? "Резервный код" : "Код из Google Authenticator"}</span>
          <input key={recovery ? "recovery" : "totp"} type="text" name="code" inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" spellCheck={false} autoCapitalize="off" pattern={recovery ? undefined : "[0-9]{6}"} minLength={recovery ? undefined : 6} maxLength={recovery ? 64 : 32} required value={code} onChange={(event) => setCode(recovery ? event.target.value : event.target.value.replace(/\D/g, "").slice(0, 6))} className={recovery ? undefined : styles.codeInput} aria-describedby="login-code-hint" />
          <small id="login-code-hint">{recovery ? "Используйте один из кодов, сохранённых при настройке входа." : "Введите 6 цифр из приложения. Если уже входили с этим кодом, дождитесь нового."}</small>
        </label>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <button className={styles.primaryButton} type="submit">{busy ? "Входим…" : "Войти"}<Arrow /></button>
        <button type="button" className={styles.textButton} onClick={() => { setRecovery(!recovery); setCode(""); setError(""); }}>{recovery ? "Ввести код из приложения" : "Нет доступа к приложению?"}</button>
      </fieldset>
    </form>
  </section>;
}

function SetupForm({ token, onComplete, onUnsavedCodesChange }: { token: string; onComplete: () => Promise<void>; onUnsavedCodesChange: (unsaved: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enrollment, setEnrollment] = useState<{ setupId: string; qrDataUrl: string; secret: string; email: string } | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onUnsavedCodesChange(Boolean(recoveryCodes) && !saved);
    return () => onUnsavedCodesChange(false);
  }, [onUnsavedCodesChange, recoveryCodes, saved]);

  useEffect(() => {
    if (!recoveryCodes || saved) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [recoveryCodes, saved]);

  async function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmation) { setError("Пароли не совпадают. Проверьте повторный ввод."); return; }
    if (password.length < 12 || password.length > 128) { setError("Используйте пароль длиной от 12 до 128 символов."); return; }
    setBusy(true);
    setError("");
    try {
      const result = await api<NonNullable<typeof enrollment>>("/api/admin/setup/begin", "POST", { token, password });
      setEnrollment(result);
      setPassword("");
      setConfirmation("");
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollment || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ ok: boolean; recoveryCodes: string[] }>("/api/admin/setup/finish", "POST", { token, setupId: enrollment.setupId, code });
      setRecoveryCodes(result.recoveryCodes);
      setEnrollment(null);
      setCode("");
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }

  function downloadCodes() {
    if (!recoveryCodes) return;
    const text = `Posadmin — резервные коды входа\n${OWNER_EMAIL}\n\nКаждый код можно использовать один раз вместе с паролем.\nХраните файл в безопасном месте.\n\n${recoveryCodes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "posadmin-recovery-codes.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className={styles.authCard} aria-labelledby="setup-title">
    <span className={styles.eyebrow}>Первый вход · {recoveryCodes ? "3" : enrollment ? "2" : "1"} из 3</span>
    <h1 id="setup-title">{recoveryCodes ? "Сохраните резервные коды" : enrollment ? "Подключите Authenticator" : "Настройте доступ"}</h1>
    {recoveryCodes ? <>
      <p className={styles.intro}>Они помогут войти, если телефон будет недоступен. Каждый код работает один раз вместе с паролем.</p>
      <ul className={styles.recoveryCodes} aria-label="Резервные коды входа">{recoveryCodes.map((value) => <li key={value}><code>{value}</code></li>)}</ul>
      <p className={styles.hint}>Коды показываются только сейчас. Сохраните их в менеджере паролей или скачайте файл и уберите в безопасное место.</p>
      <button type="button" onClick={downloadCodes} className={styles.secondaryButton}>Скачать коды</button>
      <label className={styles.checkbox}><input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} /><span>Резервные коды сохранены</span></label>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <button type="button" disabled={!saved || busy} className={styles.primaryButton} onClick={async () => {
        setBusy(true); setError("");
        try { await onComplete(); } catch (failure) { setError(errorMessage(failure)); setBusy(false); }
      }}>{busy ? "Открываем…" : "Перейти к прайсу"}<Arrow /></button>
    </> : enrollment ? <>
      <p className={styles.intro}>Откройте Google Authenticator, добавьте аккаунт и отсканируйте QR-код.</p>
      <div className={styles.qrFrame}>
        {/* The setup API returns a local data image; it must never be sent to an image proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enrollment.qrDataUrl.startsWith("data:image/") ? enrollment.qrDataUrl : undefined} width={208} height={208} alt="QR-код для добавления аккаунта Posadmin в Google Authenticator" />
      </div>
      <details className={styles.manualSetup}><summary>Настраиваю на этом же телефоне</summary><p>Добавьте аккаунт вручную. Название: Posadmin ({enrollment.email}). Тип ключа: по времени.</p><label className={styles.field}><span>Ключ для приложения</span><input className={styles.secret} readOnly value={enrollment.secret} aria-label="Секретный ключ Google Authenticator" onFocus={(event) => event.target.select()} /></label><small>Этот ключ даёт доступ к кодам входа. Не передавайте его другим.</small></details>
      <form onSubmit={finish} className={styles.form} aria-busy={busy}><fieldset disabled={busy}>
        <label className={styles.field}><span>Код из приложения</span><input type="text" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={32} required className={styles.codeInput} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} aria-describedby="setup-code-hint" /><small id="setup-code-hint">Введите 6 цифр из приложения. Если код успел смениться, используйте новый.</small></label>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <button type="submit" className={styles.primaryButton}>{busy ? "Проверяем…" : "Подтвердить и продолжить"}<Arrow /></button>
      </fieldset></form>
    </> : <>
      <p className={styles.intro}>Кабинет для <span className={styles.email}>{OWNER_EMAIL}</span>. Сначала задайте пароль, затем подключите коды из приложения.</p>
      <form onSubmit={begin} className={styles.form} aria-busy={busy}><fieldset disabled={busy}>
        <input type="text" name="username" autoComplete="username" value={OWNER_EMAIL} readOnly hidden />
        <label className={styles.field}><span>Новый пароль</span><input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required aria-describedby="setup-password-hint" /><small id="setup-password-hint">От 12 символов. Можно использовать длинную фразу.</small></label>
        <label className={styles.field}><span>Повторите пароль</span><input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <button type="submit" className={styles.primaryButton}>{busy ? "Подготавливаем…" : "Продолжить"}<Arrow /></button>
      </fieldset></form>
    </>}
  </section>;
}

function PricingEditor({ snapshot: initialSnapshot, initialHistory, preservedDraft, onExpire, onDirtyChange, onSaved }: {
  snapshot: Snapshot; initialHistory: HistoryEntry[]; preservedDraft: PreservedDraft | null;
  onExpire: (draft: PreservedDraft) => void; onDirtyChange: (dirty: boolean) => void; onSaved: () => void;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(() => preservedDraft?.draft ?? toDraft(initialSnapshot.config));
  const [revision, setRevision] = useState(preservedDraft?.revision ?? initialSnapshot.revision);
  const [activeModule, setActiveModule] = useState<ModuleId>("base");
  const [workplaces, setWorkplaces] = useState("3");
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [status, setStatus] = useState(preservedDraft ? "Несохранённые изменения восстановлены. Проверьте цены перед сохранением." : "");
  const [history, setHistory] = useState(initialHistory);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [validation, setValidation] = useState<FormulaValidation | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const latestDraft = useRef<PreservedDraft>({ draft, revision });
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(snapshot.config));
  const active = modules.find(({ id }) => id === activeModule)!;
  const count = /^\d+$/.test(workplaces) ? Number(workplaces) : NaN;
  const previewCountValid = Number.isSafeInteger(count) && count >= 1 && count <= 10000;
  const parsed = fromDraft(draft);
  const checkingFormulas = modules.some(({ id }) => validation?.draft[id] !== draft[id]);
  const invalidModules = modules.filter(({ id }) => validation?.draft[id] === draft[id] && validation.issues[id]);
  const activeFormulaReady = validation?.draft[activeModule] === draft[activeModule];
  const activeFormulaIssue = activeFormulaReady ? validation?.issues[activeModule] : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const issues = Object.fromEntries(modules.map(({ id }) => [id, getFormulaIssue(draft[id])])) as FormulaValidation["issues"];
      setValidation({ draft, issues });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => { latestDraft.current = { draft, revision }; }, [draft, revision]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function updateFormula(value: string) {
    setDraft((previous) => ({ ...previous, [activeModule]: value }));
    setStatus("");
    if (!conflict) setError("");
  }

  function previewPrice(id: ModuleId, workplaceCount: number): string {
    if (validation?.draft[id] !== draft[id] || validation.issues[id]) return "—";
    return `${money.format(getSchedulePrice(workplaceCount, schedule(parsed, id)))} ₽`;
  }

  function handleExpiry(failure: unknown): boolean {
    if (failure instanceof ApiError && failure.status === 401) {
      onExpire(latestDraft.current);
      return true;
    }
    return false;
  }

  async function loadHistory() {
    if (historyBusy) return;
    setHistoryBusy(true);
    setHistoryError("");
    try { setHistory((await api<{ history: HistoryEntry[] }>("/api/admin/history")).history); }
    catch (failure) { if (!handleExpiry(failure)) setHistoryError(errorMessage(failure)); }
    finally { setHistoryBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !dirty || conflict || checkingFormulas || invalidModules.length > 0) return;
    const checked = validatePricingConfig(parsed);
    if (!checked.ok) {
      const invalidModule = modules.find(({ id }) => {
        const candidate: PricingConfig = id === "itAdministration"
          ? { ...snapshot.config, itAdministration: parsed.itAdministration }
          : { ...snapshot.config, rkeeper: { ...snapshot.config.rkeeper, [id]: parsed.rkeeper[id] } };
        return !validatePricingConfig(candidate).ok;
      });
      if (invalidModule) setActiveModule(invalidModule.id);
      setError(checked.error);
      return;
    }
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const next = await api<Snapshot>("/api/admin/pricing", "PUT", { config: checked.value, revision });
      setSnapshot(next);
      setRevision(next.revision);
      setDraft(toDraft(next.config));
      latestDraft.current = { draft: toDraft(next.config), revision: next.revision };
      setStatus("Цены сохранены. Новый прайс применяется на сайте.");
      onSaved();
      void loadHistory();
    } catch (failure) {
      if (!handleExpiry(failure)) {
        if (failure instanceof ApiError && failure.status === 409) { setConflict(true); setError("Прайс уже изменён в другом окне. Ваш черновик сохранён на этом экране. Загрузите актуальные цены перед новым сохранением."); }
        else setError(errorMessage(failure));
      }
    } finally { setSaving(false); }
  }

  async function reloadPrices() {
    if (dirty && !window.confirm("Загрузить актуальный прайс? Несохранённые изменения на этом экране будут заменены.")) return;
    setReloading(true);
    setError("");
    try {
      const result = await api<Session>("/api/admin/session");
      if (!result.authenticated || !result.snapshot) { onExpire(latestDraft.current); return; }
      setSnapshot(result.snapshot); setRevision(result.snapshot.revision); setDraft(toDraft(result.snapshot.config));
      latestDraft.current = { draft: toDraft(result.snapshot.config), revision: result.snapshot.revision };
      setConflict(false); setStatus("Загружены актуальные цены."); onSaved();
      if (result.history) setHistory(result.history);
    } catch (failure) { if (!handleExpiry(failure)) setError(errorMessage(failure)); }
    finally { setReloading(false); }
  }

  function restore(entry: HistoryEntry) {
    if (dirty && !window.confirm("Заменить текущий черновик ценами выбранной версии? Изменения на сайте появятся только после сохранения.")) return;
    setDraft(toDraft(entry.config));
    setStatus(`Версия ${entry.revision} загружена в черновик. Проверьте цены и нажмите «Сохранить цены», чтобы применить её на сайте.`);
    if (!conflict) setError("");
  }

  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % modules.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + modules.length) % modules.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = modules.length - 1;
    else return;
    event.preventDefault(); setActiveModule(modules[next].id); tabs.current[next]?.focus();
  }

  return <div className={styles.editor}>
    <div className={styles.pageTitle}><div><span className={styles.eyebrow}>Управление сайтом</span><h1>Ваш прайс</h1><p>Настраивайте формулы стоимости пакетов и проверяйте расчёт перед сохранением.</p></div><div className={styles.savedAt}><span>Текущая версия · {snapshot.revision}</span><time dateTime={snapshot.updatedAt ?? undefined}>{dateLabel(snapshot.updatedAt)}</time></div></div>
    <form onSubmit={save} aria-busy={saving || reloading}>
      <div className={styles.editorGrid}>
        <section className={styles.priceCard} aria-label="Редактирование цен">
          <div className={styles.tabList} role="tablist" aria-label="Пакеты услуг">{modules.map((item, index) => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={activeModule === item.id} aria-label={invalidModules.some(({ id }) => id === item.id) ? `${item.tab}: ошибка в формуле` : undefined} tabIndex={activeModule === item.id ? 0 : -1} ref={(element) => { tabs.current[index] = element; }} onKeyDown={(event) => tabKey(event, index)} onClick={() => setActiveModule(item.id)} className={styles.tab}>{item.tab}{invalidModules.some(({ id }) => id === item.id) && <span className={styles.tabError} aria-hidden="true" />}</button>)}</div>
          {modules.filter(({ id }) => id !== activeModule).map(({ id }) => <div key={id} role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden />)}
          <div role="tabpanel" id={`panel-${activeModule}`} aria-labelledby={`tab-${activeModule}`} className={styles.pricePanel}>
            <h2>{active.title}</h2><p className={styles.panelDescription}>{active.description}</p>
            <fieldset disabled={saving || reloading}>
              <label className={styles.field}><span>Формула стоимости в месяц, ₽</span><textarea className={styles.formulaInput} name={`formula-${activeModule}`} value={draft[activeModule]} onChange={(event) => updateFormula(event.target.value)} rows={8} maxLength={4096} spellCheck={false} autoCapitalize="off" autoCorrect="off" required aria-invalid={Boolean(activeFormulaIssue)} aria-describedby={`formula-hint formula-status-${activeModule}`} /></label>
              <p className={styles.formulaHint} id="formula-hint"><strong>N</strong> — количество рабочих мест. Можно вставить формулу из Excel: <strong>D$4</strong> также обозначает количество мест.</p>
            </fieldset>
            <div id={`formula-status-${activeModule}`} className={styles.formulaStatus} data-error={Boolean(activeFormulaIssue)} aria-live="polite">{!activeFormulaReady ? "Проверяем формулу…" : activeFormulaIssue || "Формула проверена. Сверьте стоимость ниже."}</div>
            <details className={styles.formulaHelp}><summary>Какие формулы подходят</summary><p>Используйте IF или ЕСЛИ, условия сравнения и действия + − * /. Аргументы можно разделять запятой или точкой с запятой. Дробные числа записываются через точку.</p><p>Например, для удалённого сопровождения:</p><code>=ЕСЛИ(N&lt;=6;3000+N*1000;10000+(N-7)*500)</code><p>Результат — положительная целая сумма в рублях. Изменения появятся на сайте только после сохранения.</p></details>
            <table className={styles.formulaTable}><caption>Проверка расчёта</caption><thead><tr><th scope="col">Мест</th><th scope="col">₽ / мес.</th><th scope="col">Мест</th><th scope="col">₽ / мес.</th></tr></thead><tbody>{previewRows.map(([left, right]) => <tr key={left}><td>{left}</td><td>{previewPrice(activeModule, left)}</td><td>{right}</td><td>{previewPrice(activeModule, right)}</td></tr>)}</tbody></table>
          </div>
        </section>
        <aside className={styles.preview} aria-labelledby="preview-title"><span className={styles.eyebrow}>Предпросмотр</span><h2 id="preview-title">Как увидит клиент</h2><p>Стоимость каждого пакета с учётом ваших изменений.</p>
          <label className={styles.field}><span>Рабочих мест</span><input type="text" inputMode="numeric" maxLength={5} value={workplaces} onChange={(event) => { if (/^\d*$/.test(event.target.value)) setWorkplaces(event.target.value); }} aria-describedby={!previewCountValid ? "preview-error" : undefined} aria-invalid={!previewCountValid} /></label>
          {!previewCountValid && <small id="preview-error" className={styles.inlineError}>Введите число от 1 до 10 000.</small>}
          <dl className={styles.previewPrices}>{modules.map(({ id, tab }) => {
            return <div key={id} data-active={activeModule === id}><dt>{tab}</dt><dd>{previewCountValid ? previewPrice(id, count) : "—"}<span>/ мес.</span></dd></div>;
          })}</dl>
          <small>Пакеты указаны отдельно. В калькуляторе выездное сопровождение подключается для выбранных городов. Выезд в другие города обсуждается с менеджером отдельно.</small>
        </aside>
      </div>
      {invalidModules.filter(({ id }) => id !== activeModule).map(({ id, tab }) => <p className={styles.otherFormulaError} key={id}><span>Проверьте формулу в пакете «{tab}».</span><button type="button" className={styles.textButton} onClick={() => { setActiveModule(id); tabs.current[modules.findIndex((item) => item.id === id)]?.focus(); }}>Открыть пакет</button></p>)}
      <div className={styles.saveBar}><div className={styles.saveStatus} aria-live="polite"><span className={styles.stateDot} data-dirty={dirty} aria-hidden="true" /><span>{saving ? "Сохраняем изменения…" : checkingFormulas ? "Проверяем формулы…" : invalidModules.length ? "Исправьте ошибки в формулах" : dirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}</span></div><div className={styles.saveActions}><button type="button" className={styles.secondaryButton} disabled={saving || reloading || !dirty} onClick={() => { if (window.confirm("Отменить несохранённые изменения?")) { setDraft(toDraft(snapshot.config)); setStatus(""); if (!conflict) setError(""); } }}>Отменить изменения</button><button type="submit" className={styles.primaryButton} disabled={!dirty || saving || reloading || conflict || checkingFormulas || invalidModules.length > 0}>{saving ? "Сохраняем…" : "Сохранить цены"}<Arrow /></button></div></div>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {conflict && <button type="button" className={styles.secondaryButton} disabled={reloading || saving} onClick={reloadPrices}>{reloading ? "Загружаем…" : "Загрузить актуальные цены"}</button>}
      {status && <p className={styles.notice} role="status">{status}</p>}
    </form>
    <details className={styles.history} onToggle={(event) => { if (event.currentTarget.open && !history.length) void loadHistory(); }}><summary><span>История изменений</span><span className={styles.historySummary}>Предыдущие версии прайса</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></summary><div className={styles.historyBody}><p>Восстановление откроет выбранную версию в черновике. Чтобы применить её на сайте, сохраните цены.</p><button type="button" className={styles.textButton} disabled={historyBusy} onClick={loadHistory}>{historyBusy ? "Загружаем…" : "Обновить историю"}</button>{historyError && <ErrorNotice>{historyError}</ErrorNotice>}{!history.length && !historyBusy && !historyError && <p className={styles.hint}>История появится после первого сохранения.</p>}<ul className={styles.historyList}>{history.map((entry) => <li key={entry.id}><div><strong>Версия {entry.revision}</strong><time dateTime={entry.createdAt}>{dateLabel(entry.createdAt)}</time></div><span className={styles.historyActor}>{entry.actor}</span><button type="button" className={styles.secondaryButton} disabled={saving || reloading || conflict} onClick={() => restore(entry)}>В черновик</button></li>)}</ul></div></details>
  </div>;
}

export function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [setupToken, setSetupToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [unsavedCodes, setUnsavedCodes] = useState(false);
  const [preservedDraft, setPreservedDraft] = useState<PreservedDraft | null>(null);
  const fragmentRead = useRef(false);

  const refreshSession = useCallback(async () => {
    const result = await api<Session>("/api/admin/session");
    setSession(result); setError("");
  }, []);

  useEffect(() => {
    if (!fragmentRead.current) {
      fragmentRead.current = true;
      const params = new URLSearchParams(window.location.hash.slice(1));
      const token = params.get("setup");
      if (token) {
        setSetupToken(token);
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
      }
    }
    let active = true;
    api<Session>("/api/admin/session").then((result) => { if (active) setSession(result); }).catch((failure) => { if (active) setError(errorMessage(failure)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!preservedDraft || session?.authenticated) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [preservedDraft, session?.authenticated]);

  async function logout() {
    if (dirty && !window.confirm("Выйти из кабинета? Несохранённые изменения будут потеряны.")) return;
    setLoggingOut(true); setError("");
    try {
      await api("/api/admin/logout", "POST", {});
      setSession((previous) => previous ? { ...previous, authenticated: false, snapshot: undefined, history: undefined } : previous);
      setPreservedDraft(null); setDirty(false); setSetupToken("");
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setLoggingOut(false); }
  }

  return <div className={styles.shell}>
    <header className={styles.header}><Link href="/" aria-label="Posadmin — на главную" className={styles.logo} onClick={(event) => {
      const warning = unsavedCodes ? "Резервные коды ещё не сохранены. После перехода они больше не будут показаны. Всё равно перейти на сайт?" : "Перейти на сайт? Несохранённые изменения будут потеряны.";
      if ((dirty || unsavedCodes || preservedDraft) && !window.confirm(warning)) event.preventDefault();
    }}><SiteLogoMark /></Link><span className={styles.headerDivider} /><span className={styles.headerTitle}>Прайс</span><nav className={styles.headerLinks} aria-label="Кабинет"><a href="/" target="_blank" rel="noopener noreferrer">На сайт <span aria-hidden="true">↗</span></a>{session?.authenticated && <button type="button" onClick={logout} disabled={loggingOut}>{loggingOut ? "Выходим…" : "Выйти"}</button>}</nav></header>
    <main className={styles.main}>
      {loading ? <div className={styles.loading} role="status"><span className={styles.loader} aria-hidden="true" />Открываем кабинет…</div> : !session ? <section className={styles.authCard}><h1>Не удалось открыть кабинет</h1><ErrorNotice>{error || "Проверьте соединение и попробуйте ещё раз."}</ErrorNotice><button type="button" className={styles.primaryButton} onClick={async () => { setLoading(true); try { await refreshSession(); } catch (failure) { setError(errorMessage(failure)); } finally { setLoading(false); } }}>Попробовать ещё раз</button></section> : !session.configured ? <section className={styles.authCard}><span className={styles.eyebrow}>Управление сайтом</span><h1>Админка ещё не настроена</h1><p className={styles.intro}>Доступ включается при подготовке сервера.</p><Link href="/" className={styles.secondaryButton}>Вернуться на сайт</Link></section> : !session.initialized ? setupToken ? <SetupForm token={setupToken} onUnsavedCodesChange={setUnsavedCodes} onComplete={async () => { await refreshSession(); setSetupToken(""); }} /> : <section className={styles.authCard}><span className={styles.eyebrow}>Первый вход</span><h1>Настройте доступ к прайсу</h1><p className={styles.intro}>Откройте личную ссылку для первоначальной настройки, полученную при подготовке сервера.</p></section> : !session.authenticated ? <LoginForm email={session.email || OWNER_EMAIL} onSuccess={refreshSession} notice={preservedDraft ? "Время входа истекло. Войдите снова — ваш черновик останется на этом экране." : undefined} /> : session.snapshot ? <>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <PricingEditor snapshot={session.snapshot} initialHistory={session.history ?? []} preservedDraft={preservedDraft} onDirtyChange={setDirty} onSaved={() => setPreservedDraft(null)} onExpire={(draft) => { setPreservedDraft(draft); setDirty(false); setSession((previous) => previous ? { ...previous, authenticated: false } : previous); }} />
      </> : <section className={styles.authCard}><h1>Не удалось загрузить прайс</h1><p className={styles.intro}>Обновите страницу и попробуйте ещё раз.</p></section>}
      <noscript><p className={styles.notice}>Для работы кабинета включите JavaScript в браузере.</p></noscript>
    </main>
    <footer className={styles.footer}>Posadmin<span>Личный кабинет</span></footer>
  </div>;
}
