/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_write.c                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/17 15:22:23 by chlpst            #+#    #+#             */
/*   Updated: 2025/09/25 17:44:47 by chlpst           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static char	*ft_strchr_printf(const char *format)
{
	while (*format)
	{
		if (*format == '%')
			return ((char *)format);
		format++;
	}
	if (!format)
		return ((char *)format);
	return (NULL);
}

const char	*ft_write_printf(const char *format, t_flags *flags)
{
	char	*next;

	next = ft_strchr_printf(format);
	if (next)
		flags->cur_len = next - format;
	else
		flags->cur_len = ft_strlen_printf(format);
	write(1, format, flags->cur_len);
	flags->fin_len += flags->cur_len;
	while (*format && *format != '%')
		format++;
	return (format);
}
