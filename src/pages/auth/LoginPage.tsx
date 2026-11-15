import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { loginSchema, type LoginFormValues } from '@/schemas/auth'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loginAsGuest = useAuthStore((state) => state.loginAsGuest)
  const [guestLoading, setGuestLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email, values.password)
      navigate('/dashboard')
    } catch (error) {
      toast({
        title: 'Could not log in',
        description: error instanceof Error ? error.message : 'Check your email and password.',
        variant: 'error',
      })
    }
  }

  async function handleGuest() {
    setGuestLoading(true)
    try {
      await loginAsGuest()
      navigate('/')
    } catch (error) {
      toast({
        title: 'Could not continue as guest',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.welcomeBack')}</CardTitle>
        <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-error-500">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-error-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'Logging in…' : t('auth.logIn')}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-text-muted">or</span>
          <Separator className="flex-1" />
        </div>

        <Button variant="outline" className="w-full" disabled={guestLoading} onClick={handleGuest}>
          {guestLoading ? 'Continuing…' : t('auth.continueAsGuest')}
        </Button>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
