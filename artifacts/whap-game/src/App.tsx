import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";
import ProfilePage from "@/pages/ProfilePage";
import MapGame from "@/pages/MapGame";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/go-for-five.png`,
  },
  variables: {
    colorPrimary: "#a78bfa",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#f87171",
    colorBackground: "#1e293b",
    colorInput: "#334155",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#475569",
    fontFamily: "'Rubik', system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-slate-700 bg-slate-800",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-extrabold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-slate-200",
    formFieldLabel: "text-slate-300",
    footerActionLink: "text-violet-400 hover:text-violet-300",
    footerActionText: "text-slate-400",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-violet-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-400",
    logoBox: "flex justify-center",
    logoImage: "h-12 w-auto object-contain",
    socialButtonsBlockButton: "border-slate-600 bg-slate-700 hover:bg-slate-600",
    formButtonPrimary: "bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 text-white font-bold",
    formFieldInput: "bg-slate-700 border-slate-600 text-white",
    footerAction: "bg-transparent",
    dividerLine: "bg-slate-700",
    alert: "bg-red-900/30 border-red-700",
    otpCodeFieldInput: "bg-slate-700 border-slate-600 text-white",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome Back",
            subtitle: "Sign in to track your score and streak",
          },
        },
        signUp: {
          start: {
            title: "Create Account",
            subtitle: "Join the AP World History leaderboard",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/map" component={MapGame} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={Home} />
      </Switch>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
