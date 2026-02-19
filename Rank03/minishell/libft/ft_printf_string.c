/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_string.c                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/17 16:52:55 by chlpst            #+#    #+#             */
/*   Updated: 2025/09/25 17:38:58 by chlpst           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static void	ft_yes_p_no_w(t_flags *flags, char *str)
{
	int	i;

	i = 0;
	while (str[i] != '\0' && i < flags->precision)
	{
		flags->fin_len += write(1, &str[i], 1);
		i++;
	}
}

static void	ft_yes_p_yes_w(t_flags *flags, char *str)
{
	int	i;
	int	str_length;

	i = 0;
	str_length = ft_strlen_printf((const char *)str);
	if (flags->precision < str_length)
		str_length = flags->precision;
	if (flags->left_justified > 0)
	{
		flags->fin_len += write(1, str, str_length);
		while (i < (flags->width - str_length))
		{
			flags->fin_len += write(1, " ", 1);
			i++;
		}
	}
	else
	{
		while (i < (flags->width - str_length))
		{
			flags->fin_len += write(1, " ", 1);
			i++;
		}
		flags->fin_len += write(1, str, str_length);
	}
}

static void	ft_no_p_no_w(t_flags *flags, char *str)
{
	int	i;

	i = 0;
	while (str[i] != '\0')
	{
		flags->fin_len += write(1, &str[i], 1);
		i++;
	}
}

static void	ft_no_p_yes_w(t_flags *flags, char *str)
{
	int	i;
	int	str_length;

	i = 0;
	str_length = ft_strlen_printf((const char *)str);
	if (flags->left_justified > 0)
	{
		flags->fin_len += write(1, str, str_length);
		while (i < (flags->width - str_length))
		{
			flags->fin_len += write(1, " ", 1);
			i++;
		}
	}
	else
	{
		while (i < (flags->width - str_length))
		{
			flags->fin_len += write(1, " ", 1);
			i++;
		}
		flags->fin_len += write(1, str, str_length);
	}
}

void	ft_print_string(t_flags *flags)
{
	char	*str;
	int		i;

	str = va_arg(flags->args, char *);
	i = 0;
	if (!str)
		str = "(null)";
	if (flags->dot == 1)
	{
		if (flags->precision == 0)
			while (i++ < flags->width)
				flags->fin_len += write(1, " ", 1);
		else if (flags->width > 0)
			ft_yes_p_yes_w(flags, str);
		else
			ft_yes_p_no_w(flags, str);
	}
	else
	{
		if (flags->width > 0)
			ft_no_p_yes_w(flags, str);
		else
			ft_no_p_no_w(flags, str);
	}
}
