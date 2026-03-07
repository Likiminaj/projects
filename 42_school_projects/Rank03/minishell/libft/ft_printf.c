/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/17 14:30:14 by chlpst            #+#    #+#             */
/*   Updated: 2025/09/25 17:42:17 by chlpst           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static t_flags	*ft_initialize_struct(t_flags *flags)
{
	flags->sign = 0;
	flags->left_justified = 0;
	flags->space = 0;
	flags->zero_pad = 0;
	flags->hash = 0;
	flags->width = 0;
	flags->dot = 0;
	flags->precision = 0;
	flags->specifier = 0;
	flags->cur_len = 0;
	flags->fin_len = 0;
	return (flags);
}

int	ft_printf(const char *format, ...)
{
	t_flags	*flags;
	int		final_result;

	flags = malloc(sizeof(t_flags));
	if (!flags)
		return (0);
	ft_initialize_struct(flags);
	va_start(flags->args, format);
	while (*format)
	{
		if (*format == '%')
			format = ft_parse(format + 1, flags);
		else
			format = ft_write_printf(format, flags);
		if (!format)
		{
			write (1, "(null)", 6);
			final_result = 6;
			return (free(flags), final_result);
		}
	}
	va_end(flags->args);
	final_result = flags->fin_len;
	return (free(flags), final_result);
}
