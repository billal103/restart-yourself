import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await sendPasswordReset(values.email)
    } catch (error) {
      // Still show the generic "sent" state — never reveal whether an
      // account exists for this email. Only a genuine network/service
      // failure is worth surfacing.
      if (error instanceof Error && /network|fetch/i.test(error.message)) {
        toast({ title: 'Could not send reset email', description: error.message, variant: 'error' })
        return
      }
    }
    setSent(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="size-8 text-success-500" />
            <p className="text-sm text-text-secondary">
              If an account exists for that email, a reset link has been sent.
            </p>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-error-500">{errors.email.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
