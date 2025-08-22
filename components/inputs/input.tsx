'use client'

import clsx from 'clsx'
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form'

interface InputProps {
  label: string
  id: string
  type?: string
  required?: boolean
  register: UseFormRegister<FieldValues>
  errors: FieldErrors
  disabled?: boolean
}

const Input: React.FC<InputProps> = ({ label, id, type, required, register, disabled }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </label>
      <div className="mt-2">
        <input
          id={id}
          type={type}
          autoComplete={id}
          disabled={disabled}
          {...register(id, { required })}
          className={clsx(
            `form-input
            block
            w-full
            rounded-md
            border-0
            py-1.5
            pl-3
            text-gray-900
            shadow-sm
            ring-1
            ring-inset
            ring-gray-400
            placeholder:text-gray-400
            focus:ring-2
            focus:ring-inset
            sm:text-sm
            sm:leading-6`,
            disabled && 'cursor-default opacity-50'
          )}
        />
      </div>
    </div>
  )
}

export default Input
