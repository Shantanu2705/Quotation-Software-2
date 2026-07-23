"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { loginAdmin } from "@/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await loginAdmin(data.email, data.password);
      
      // Set a dummy cookie to pass middleware during dev
      document.cookie = "admin-session=true; path=/";
      
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="relative">
        <div className="absolute -inset-1 rounded-[1.5rem] bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 blur-2xl transition-all duration-1000 group-hover:-inset-2 opacity-50 dark:opacity-40"></div>
        
        <Card className="glass-card relative border-none shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <motion.div 
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-background to-muted shadow-inner relative overflow-hidden ring-1 ring-primary/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
              <Image src="/watermark.png" alt="Digital Dictionary Logo" width={60} height={60} className="object-contain drop-shadow-md z-10" />
            </motion.div>
            <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Sign in to Digital Dictionary
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="font-semibold text-foreground/90">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@digitaldictionary.com"
                  className="h-12 bg-background/50 border-input/50 focus:bg-background focus:ring-2 focus:ring-primary/40 transition-all rounded-xl"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm font-medium text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold text-foreground/90">Password</Label>
                  <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="h-12 bg-background/50 border-input/50 focus:bg-background focus:ring-2 focus:ring-primary/40 transition-all rounded-xl"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm font-medium text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>
              
              {error && (
                <div className="rounded-xl bg-destructive/10 p-3.5 text-sm font-medium text-destructive border border-destructive/20 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive"></div>
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 rounded-xl text-md font-semibold premium-shadow mt-4 overflow-hidden relative group" disabled={isLoading}>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 py-6 mt-6 bg-muted/20 rounded-b-[1rem]">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Secure Connection
            </p>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
}
