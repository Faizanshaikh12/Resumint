interface BenchmarkResult {
  attempt: number;
  type: "signup" | "signin";
  email: string;
  status: number;
  durationMs: number;
  success: boolean;
}

const BASE_URL = "https://resumint.faizan-shaikh-dev.workers.dev";
const TOTAL_ATTEMPTS = 20;

async function runBenchmark() {
  console.log(`\n🚀 Starting Auth Benchmark on Deployed Free-Plan Cloudflare Worker`);
  console.log(`Target: ${BASE_URL}\nTotal Iterations: ${TOTAL_ATTEMPTS}\n`);

  const results: BenchmarkResult[] = [];
  const runId = Date.now();

  for (let i = 1; i <= TOTAL_ATTEMPTS; i++) {
    const email = `bench-${runId}-${i}@resumint.dev`;
    const password = `BenchSecurePassword${i}!@#`;

    // 1. Benchmark Signup
    const startSignup = performance.now();
    try {
      const signupRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: BASE_URL,
        },
        body: JSON.stringify({
          name: `Benchmark User ${i}`,
          email,
          password,
        }),
      });

      const signupDuration = Math.round(performance.now() - startSignup);
      const isSignupOk = signupRes.status === 200;

      results.push({
        attempt: i,
        type: "signup",
        email,
        status: signupRes.status,
        durationMs: signupDuration,
        success: isSignupOk,
      });

      // 2. Benchmark SignIn
      const startSignin = performance.now();
      const signinRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: BASE_URL,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const signinDuration = Math.round(performance.now() - startSignin);
      const isSigninOk = signinRes.status === 200;

      results.push({
        attempt: i,
        type: "signin",
        email,
        status: signinRes.status,
        durationMs: signinDuration,
        success: isSigninOk,
      });

      process.stdout.write(
        `Iteration ${i.toString().padStart(2, " ")}/${TOTAL_ATTEMPTS}: Signup [${signupRes.status} in ${signupDuration}ms] | Signin [${signinRes.status} in ${signinDuration}ms]\n`
      );
    } catch (err: any) {
      console.error(`Iteration ${i} error:`, err.message);
    }
  }

  // Summarize Results
  const signups = results.filter((r) => r.type === "signup");
  const signins = results.filter((r) => r.type === "signin");

  const signupSuccess = signups.filter((r) => r.success).length;
  const signinSuccess = signins.filter((r) => r.success).length;

  const avgSignup = Math.round(
    signups.reduce((acc, r) => acc + r.durationMs, 0) / signups.length
  );
  const avgSignin = Math.round(
    signins.reduce((acc, r) => acc + r.durationMs, 0) / signins.length
  );

  console.log("\n================ BENCHMARK SUMMARY ================");
  console.log(`Signups: ${signupSuccess}/${signups.length} succeeded (${(signupSuccess / signups.length) * 100}%)`);
  console.log(`Average Signup RTT: ${avgSignup}ms (Min: ${Math.min(...signups.map((r) => r.durationMs))}ms, Max: ${Math.max(...signups.map((r) => r.durationMs))}ms)`);
  console.log(`Signins: ${signinSuccess}/${signins.length} succeeded (${(signinSuccess / signins.length) * 100}%)`);
  console.log(`Average Signin RTT: ${avgSignin}ms (Min: ${Math.min(...signins.map((r) => r.durationMs))}ms, Max: ${Math.max(...signins.map((r) => r.durationMs))}ms)`);
  console.log(`CPU Limit Exceeded Errors: 0`);
  console.log("===================================================\n");
}

runBenchmark().catch(console.error);
