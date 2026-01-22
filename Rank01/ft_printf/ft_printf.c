/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/09 15:02:54 by lraghave          #+#    #+#             */
/*   Updated: 2025/07/16 15:09:59 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "ft_printf.h"

int	ft_printf(const char *format, ...)
{
	int		i;
	int		bytes_printed;
	va_list	args;

	va_start (args, format);
	i = 0;
	bytes_printed = 0;
	while (format[i])
	{
		if (format[i] == '%')
		{
			i++;
			if (!ft_format_check(format[i]))
			{
				write(1, "Error", 5);
				return (1);
			}
			ft_type(format[i], &bytes_printed, args);
		}
		else
			bytes_printed += write(1, &format[i], 1);
		i++;
	}
	va_end(args);
	return (bytes_printed);
}

int	ft_format_check(const char c)
{
	char	*str;

	str = "cspdiuxX%";
	while (*str)
	{
		if (*str == c)
			return (1);
		str++;
	}
	return (0);
}

void	ft_type(char c, int *bytes_printed, va_list args)
{
	if (c == 'c')
		*bytes_printed += ft_putchar_fd_mod(va_arg(args, int), 1);
	if (c == 's')
		*bytes_printed += ft_putstr_fd_mod(va_arg(args, char *), 1);
	if (c == 'p')
		*bytes_printed += ft_putadd_fd_mod(va_arg(args, void *), 1);
	if (c == 'd')
		*bytes_printed += ft_putnbr_fd_mod(va_arg(args, int), 1);
	if (c == 'i')
		*bytes_printed += ft_putnbr_fd_mod(va_arg(args, int), 1);
	if (c == 'u')
		*bytes_printed += ft_putnbru_fd_mod(va_arg(args, unsigned int), 1);
	if (c == 'x')
		*bytes_printed += ft_puthexl_fd_mod(va_arg(args, unsigned int), 1);
	if (c == 'X')
		*bytes_printed += ft_puthexu_fd_mod(va_arg(args, unsigned int), 1);
	if (c == '%')
		*bytes_printed += ft_putchar_fd_mod('%', 1);
}
