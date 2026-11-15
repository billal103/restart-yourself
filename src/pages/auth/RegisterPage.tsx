import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerSchema, type RegisterFormValues } from '@/schemas/auth'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const register_ = useAuthStore((state) => state.register)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { agreeToTerms: false },
  })

  async function onSubmit(values: RegisterFormValues) {
    try {
      const { requiresEmailConfirmation } = await register_(values.email, values.password)
      if (requiresEmailConfirmation) {
        setAwaitingConfirmation(true)
        return
      }
      navigate('/dashboard')
    } catch (error) {
      toast({
        title: 'Could not create account',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  if (awaitingConfirmation) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <MailCheck className="size-10 text-primary-500" />
          <h2 className="text-lg font-semibold text-text-primary">Check your email</h2>
          <p className="text-sm text-text-secondary">
            We sent a confirmation link to finish creating your account. Once confirmed, you can
            log in.
          </p>
          <Button asChild className="mt-2">
            <Link to="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Your public profile stays anonymous by default — this email is only used for account
          access, never shown to other members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-error-500">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-error-500">{errors.password.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="text-xs text-error-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="agreeToTerms"
              checked={watch('agreeToTerms')}
              onCheckedChange={(checked) => setValue('agreeToTerms', checked === true)}
            />
            <Label htmlFor="agreeToTerms" className="text-sm font-normal text-text-secondary">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/guidelines" className="text-primary-600 underline">
                Community Guidelines
              </Link>
              .
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-xs text-error-500">{errors.agreeToTerms.message}</p>
          )}
          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
