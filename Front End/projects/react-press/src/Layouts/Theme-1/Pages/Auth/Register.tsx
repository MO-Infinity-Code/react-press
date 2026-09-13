import { useEffect, useRef, useState } from "react";
import type { FormEvent, MutableRefObject, ReactNode } from "react";

type AuthView = "sign-in" | "register" | "forgot" | "verify";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const inputError = "This field is required.";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 29;

function Register() {
  const [view, setView] = useState<AuthView>("sign-in");
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [signInSuccess, setSignInSuccess] = useState(false);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown for "Resend in 00:29" while on the verify view
  useEffect(() => {
    if (view !== "verify") return;
    const timer = setInterval(() => {
      setResendSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  const goTo = (nextView: AuthView) => {
    setView(nextView);
    setErrors({});
    setSignInSuccess(false);
    if (nextView === "verify") {
      setCode(["", "", "", "", "", ""]);
      setCodeError("");
      setResendSeconds(RESEND_SECONDS);
    }
  };

  const validate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextErrors: FormErrors = {};

    const nameValue = String(form.get("name") || "").trim();
    const emailValue = String(form.get("email") || "").trim();
    const passwordValue = String(form.get("password") || "").trim();
    const confirmPasswordValue = String(
      form.get("confirmPassword") || "",
    ).trim();

    if (view === "register" && !nameValue) {
      nextErrors.name = "Full name is required.";
    }

    if (!emailValue) {
      nextErrors.email = inputError.replace("This field", "Email address");
    } else if (!emailPattern.test(emailValue)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (view === "sign-in" || view === "register") {
      if (!passwordValue) {
        nextErrors.password = "Password is required.";
      } else if (view === "register" && passwordValue.length < 8) {
        nextErrors.password = "Password must be at least 8 characters.";
      }
    }

    if (view === "register") {
      if (!confirmPasswordValue) {
        nextErrors.confirmPassword = "Please confirm your password.";
      } else if (passwordValue && confirmPasswordValue !== passwordValue) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setEmail(emailValue);
      if (view === "register" || view === "forgot") {
        goTo("verify");
      } else if (view === "sign-in") {
        setSignInSuccess(true);
      }
    }
  };

  const updateCode = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = digit;
    setCode(nextCode);
    setCodeError("");
    if (digit && index < code.length - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (code.some((digit) => !digit)) {
      setCodeError("Please enter all 6 digits.");
      return;
    }
    setCodeError("");
    // Hand off to whatever confirms the code against the backend.
    goTo("sign-in");
  };

  const handleResend = () => {
    if (resendSeconds > 0) return;
    setResendSeconds(RESEND_SECONDS);
    setCode(["", "", "", "", "", ""]);
    codeRefs.current[0]?.focus();
    // Hand off to whatever re-sends the verification code.
  };

  const handleGoogleContinue = () => {
    // Hand off to your OAuth flow (e.g. redirect to /auth/google).
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-photo">
          <div className="photo-overlay" />
          <p>
            Your ideas deserve
            <br />a space to grow.
          </p>
        </div>
        <section className="auth-panel">
          {view === "sign-in" && (
            <SignInView
              errors={errors}
              onSubmit={validate}
              onCreateAccount={() => goTo("register")}
              onForgot={() => goTo("forgot")}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onGoogleContinue={handleGoogleContinue}
              success={signInSuccess}
            />
          )}
          {view === "register" && (
            <RegisterView
              errors={errors}
              onSubmit={validate}
              onSignIn={() => goTo("sign-in")}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              onGoogleContinue={handleGoogleContinue}
            />
          )}
          {view === "forgot" && (
            <ForgotView
              errors={errors}
              onSubmit={validate}
              onBack={() => goTo("sign-in")}
            />
          )}
          {view === "verify" && (
            <VerifyView
              email={email || "you@example.com"}
              code={code}
              codeError={codeError}
              codeRefs={codeRefs}
              onCodeChange={updateCode}
              onCodeKeyDown={handleCodeKeyDown}
              onChangeEmail={() => goTo("forgot")}
              onVerify={handleVerify}
              onResend={handleResend}
              resendSeconds={resendSeconds}
            />
          )}
        </section>
      </section>
      <style>{styles}</style>
    </main>
  );
}

type PasswordProps = {
  name: string;
  placeholder: string;
  error?: string;
  visible: boolean;
  onToggle: () => void;
};

function PasswordField({
  name,
  placeholder,
  error,
  visible,
  onToggle,
}: PasswordProps) {
  return (
    <Field
      label={name === "confirmPassword" ? "Confirm Password" : "Password"}
      error={error}
    >
      <div className={`password-wrap ${error ? "has-error" : ""}`}>
        <input
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="eye-button"
          onClick={onToggle}
          aria-label="Toggle password visibility"
        >
          {visible ? "◉" : "◌"}
        </button>
      </div>
    </Field>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="error-text">ⓘ {error}</small>}
    </label>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span>R</span>
      <strong>ReactPress</strong>
    </div>
  );
}

function AuthTabs({
  active,
  onCreateAccount,
  onSignIn,
}: {
  active: "sign-in" | "register";
  onCreateAccount: () => void;
  onSignIn: () => void;
}) {
  return (
    <div className="auth-tabs">
      <button
        className={active === "register" ? "active" : ""}
        onClick={onCreateAccount}
        type="button"
      >
        Create Account
      </button>
      <button
        className={active === "sign-in" ? "active" : ""}
        onClick={onSignIn}
        type="button"
      >
        Sign In
      </button>
    </div>
  );
}

function SocialButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="social-button" onClick={onClick}>
      <span className="google-g">G</span> Continue with Google
    </button>
  );
}

function Divider() {
  return (
    <div className="divider">
      <span>or continue with</span>
    </div>
  );
}

function SignInView({
  errors,
  onSubmit,
  onCreateAccount,
  onForgot,
  showPassword,
  setShowPassword,
  onGoogleContinue,
  success,
}: {
  errors: FormErrors;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCreateAccount: () => void;
  onForgot: () => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  onGoogleContinue: () => void;
  success: boolean;
}) {
  return (
    <div className="view sign-in-view">
      <Brand />
      <h1>Welcome back!</h1>
      <p className="subtitle">Sign in to continue building your site.</p>
      <AuthTabs
        active="sign-in"
        onCreateAccount={onCreateAccount}
        onSignIn={() => undefined}
      />
      {success && <p className="success-text">✓ Signed in successfully.</p>}
      <form onSubmit={onSubmit} noValidate>
        <Field label="Email Address" error={errors.email}>
          <input name="email" type="email" placeholder="you@example.com" />
        </Field>
        <PasswordField
          name="password"
          placeholder="Enter your password"
          error={errors.password}
          visible={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
        />
        <button type="button" className="forgot-link" onClick={onForgot}>
          Forgot password?
        </button>
        <button className="primary-button" type="submit">
          Sign in
        </button>
      </form>
      <Divider />
      <SocialButton onClick={onGoogleContinue} />
    </div>
  );
}

function RegisterView({
  errors,
  onSubmit,
  onSignIn,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onGoogleContinue,
}: {
  errors: FormErrors;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSignIn: () => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  onGoogleContinue: () => void;
}) {
  return (
    <div className="view register-view">
      <Brand />
      <h1>Create your account</h1>
      <p className="subtitle">Start building your site today. It's free.</p>
      <AuthTabs
        active="register"
        onCreateAccount={() => undefined}
        onSignIn={onSignIn}
      />
      <form onSubmit={onSubmit} noValidate>
        <Field label="Full Name" error={errors.name}>
          <input name="name" placeholder="Jane Smith" />
        </Field>
        <Field label="Email Address" error={errors.email}>
          <input name="email" type="email" placeholder="you@example.com" />
        </Field>
        <PasswordField
          name="password"
          placeholder="At least 8 characters"
          error={errors.password}
          visible={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
        />
        <PasswordField
          name="confirmPassword"
          placeholder="Repeat your password"
          error={errors.confirmPassword}
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        />
        <button className="primary-button" type="submit">
          Create account
        </button>
      </form>
      <Divider />
      <SocialButton onClick={onGoogleContinue} />
    </div>
  );
}

function ForgotView({
  errors,
  onSubmit,
  onBack,
}: {
  errors: FormErrors;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}) {
  return (
    <div className="view forgot-view">
      <Brand />
      <h1>Forgot password?</h1>
      <p className="subtitle">
        Enter your email address and we'll send you a verification
        <br />
        code to reset your password.
      </p>
      <button type="button" className="back-link" onClick={onBack}>
        Back to Sign In
      </button>
      <form onSubmit={onSubmit} noValidate>
        <Field label="Email address" error={errors.email}>
          <input
            name="email"
            type="email"
            placeholder="Enter your email address"
          />
        </Field>
        <button className="primary-button" type="submit">
          Send verification code
        </button>
      </form>
    </div>
  );
}

function VerifyView({
  email,
  code,
  codeError,
  codeRefs,
  onCodeChange,
  onCodeKeyDown,
  onChangeEmail,
  onVerify,
  onResend,
  resendSeconds,
}: {
  email: string;
  code: string[];
  codeError: string;
  codeRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  onCodeChange: (index: number, value: string) => void;
  onCodeKeyDown: (index: number, key: string) => void;
  onChangeEmail: () => void;
  onVerify: () => void;
  onResend: () => void;
  resendSeconds: number;
}) {
  const formattedTime = `00:${resendSeconds.toString().padStart(2, "0")}`;

  return (
    <div className="view verify-view">
      <Brand />
      <h1>Verify your email</h1>
      <p className="subtitle">
        We've sent a 6-digit code to <strong>{email}</strong>
      </p>
      <button type="button" className="back-link" onClick={onChangeEmail}>
        Change email
      </button>
      <div className="code-inputs">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              codeRefs.current[index] = element;
            }}
            value={digit}
            maxLength={1}
            inputMode="numeric"
            onChange={(event) => onCodeChange(index, event.target.value)}
            onKeyDown={(event) => onCodeKeyDown(index, event.key)}
            aria-label={`Verification digit ${index + 1}`}
          />
        ))}
      </div>
      {codeError && <small className="error-text">ⓘ {codeError}</small>}
      <button className="primary-button" type="button" onClick={onVerify}>
        Verify email
      </button>
      <p className="resend-text">
        Didn't receive the code?{" "}
        {resendSeconds > 0 ? (
          <span>Resend in {formattedTime}</span>
        ) : (
          <button type="button" className="resend-button" onClick={onResend}>
            Resend code
          </button>
        )}
      </p>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
:root { font-family: 'DM Sans', sans-serif; color: #111827; }
* { box-sizing: border-box; }
.auth-page { min-height: 100vh; display: grid; place-items: center; padding: 42px 24px; background: #edf0f4; }
.auth-shell { width: min(890px, 100%); min-height: 520px; display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border-radius: 16px; background: #fff; box-shadow: 0 22px 55px rgba(17, 24, 39, .09); }
.auth-photo { position: relative; min-height: 520px; background: url('/pic-1.jpg') center / cover; color: #fff; display: flex; align-items: flex-end; padding: 34px; }
.photo-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,.7), rgba(0,0,0,.03) 70%); }
.auth-photo p { position: relative; margin: 0; font-size: 18px; line-height: 1.25; font-weight: 600; }
.auth-panel { display: grid; place-items: center; padding: 36px 54px; }
.view { width: min(100%, 305px); text-align: center; }
.brand { display: inline-flex; align-items: center; gap: 9px; margin-bottom: 27px; font-size: 13px; }
.brand span { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 7px; background: #10182c; color: #fff; font-size: 12px; font-weight: 700; }
.brand strong { font-weight: 700; }
h1 { margin: 0; font-size: 20px; line-height: 1.3; letter-spacing: -.4px; }
.subtitle { color: #7c8798; margin: 6px 0 20px; font-size: 11px; line-height: 1.5; }
.success-text { margin: -10px 0 16px; color: #12b76a; font-size: 10px; font-weight: 600; }
.auth-tabs { display: flex; padding: 3px; height: 36px; margin-bottom: 23px; border-radius: 7px; background: #f1f2f4; }
.auth-tabs button { flex: 1; border: 0; border-radius: 6px; background: transparent; color: #98a1af; font: inherit; font-size: 10px; cursor: pointer; }
.auth-tabs button.active, .primary-button { color: #fff; background: #10182c; box-shadow: 0 2px 5px rgba(16,24,44,.12); }
form { text-align: left; }
.field { display: block; margin-bottom: 12px; text-align: left; }
.field > span { display: block; margin-bottom: 6px; color: #344054; font-size: 10px; font-weight: 600; }
input { width: 100%; height: 36px; border: 1px solid #dbe0e7; border-radius: 6px; outline: none; padding: 0 12px; color: #202938; background: #fff; font: inherit; font-size: 10px; transition: border-color .2s, box-shadow .2s; }
input::placeholder { color: #a7b0bf; }
input:focus { border-color: #8794aa; box-shadow: 0 0 0 3px rgba(16,24,44,.08); }
input.has-error, .has-error input { border-color: #ff8585; }
.password-wrap { position: relative; }
.password-wrap input { padding-right: 34px; }
.eye-button { position: absolute; top: 0; right: 0; width: 35px; height: 36px; border: 0; background: transparent; color: #96a1b2; cursor: pointer; font-size: 16px; }
.error-text { display: block; margin-top: 4px; color: #f05252; font-size: 9px; }
.forgot-link, .back-link { display: block; margin: -4px 0 16px auto; border: 0; background: none; color: #145eff; font: inherit; font-size: 10px; cursor: pointer; }
.back-link { margin: -12px auto 26px; color: #202938; text-decoration: underline; font-weight: 600; }
.primary-button, .social-button { width: 100%; height: 36px; border: 0; border-radius: 6px; font: inherit; font-size: 10px; font-weight: 600; cursor: pointer; }
.divider { display: flex; align-items: center; gap: 10px; color: #a4acb8; margin: 22px 0 18px; font-size: 9px; }
.divider::before, .divider::after { content: ''; height: 1px; flex: 1; background: #e6e9ee; }
.social-button { border: 1px solid #e1e5eb; background: #fff; color: #263142; font-weight: 500; }
.google-g { margin-right: 8px; color: #4285f4; font-size: 15px; font-weight: 700; }
.forgot-view form { margin-top: 0; }
.forgot-view .field { margin-bottom: 14px; }
.verify-view .subtitle { margin-bottom: 0; }
.verify-view .back-link { margin-top: 4px; margin-bottom: 22px; }
.code-inputs { display: flex; gap: 7px; margin-bottom: 17px; }
.code-inputs input { width: 42px; height: 34px; padding: 0; text-align: center; font-size: 15px; }
.resend-text { margin: 14px 0 0; color: #9099a8; font-size: 9px; }
.resend-text span { color: #7f8998; }
.resend-button { border: 0; background: none; color: #145eff; font: inherit; font-size: 9px; font-weight: 600; cursor: pointer; padding: 0; }
@media (max-width: 680px) { .auth-page { padding: 18px 12px; } .auth-shell { grid-template-columns: 1fr; } .auth-photo { min-height: 180px; padding: 24px; } .auth-photo p { font-size: 16px; } .auth-panel { padding: 36px 24px 42px; } }
@media (max-width: 380px) { .auth-panel { padding-inline: 18px; } .code-inputs { gap: 4px; } .code-inputs input { width: 39px; } }
`;

export default Register;
