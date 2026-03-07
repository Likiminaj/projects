/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_parse.c                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/17 15:34:35 by chlpst            #+#    #+#             */
/*   Updated: 2025/09/25 17:38:44 by chlpst           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static void	ft_fmt_treatment(t_flags *flags)
{
	if (flags->specifier == 'c')
		ft_print_char(flags);
	if (flags->specifier == 's')
		ft_print_string(flags);
	if (flags->specifier == 'p')
		ft_print_pointer(flags);
	if (flags->specifier == 'd' || flags->specifier == 'i')
		ft_print_int(flags);
	if (flags->specifier == 'u')
		ft_print_unsigned_int(flags);
	if (flags->specifier == 'x' || flags->specifier == 'X')
		ft_print_hexa(flags);
}

static int	is_valid_specifier(char c)
{
	return (c == 'c' || c == 's' || c == 'p'
		|| c == 'd' || c == 'i' || c == 'u'
		|| c == 'x' || c == 'X');
}

static void	ft_fmt_analysis_part_2(const char **format, t_flags *flags)
{
	while (**format && !is_valid_specifier(**format))
	{
		if (**format >= '1' && **format <= '9')
		{
			flags->width = ft_atoi_printf(format);
			continue ;
		}
		else if (**format == '*')
			flags->width = va_arg(flags->args, int);
		else if (**format == '.')
		{
			(*format)++;
			flags->dot = 1;
			if (**format == '*')
			{
				flags->precision = va_arg(flags->args, int);
				(*format)++;
			}
			else
				flags->precision = ft_atoi_printf(format);
		}
		else
			break ;
	}
}

static void	ft_fmt_analysis_part_1(const char **format, t_flags *flags)
{
	while (**format && !is_valid_specifier(**format))
	{
		if (**format == '+')
			flags->sign = 1;
		else if (**format == '-')
			flags->left_justified = 1;
		else if (**format == ' ')
			flags->space = 1;
		else if (**format == '0')
			flags->zero_pad = 1;
		else if (**format == '#')
			flags->hash = 1;
		else
			break ;
		(*format)++;
	}
}

const char	*ft_parse(const char *format, t_flags *flags)
{
	if (*format == '%')
	{
		write(1, "%", 1);
		flags->fin_len += 1;
		return (format + 1);
	}
	ft_fmt_analysis_part_1(&format, flags);
	ft_fmt_analysis_part_2(&format, flags);
	if (is_valid_specifier(*format))
	{
		flags->specifier = *format;
		ft_fmt_treatment(flags);
		return (format + 1);
	}
	return (NULL);
}
