/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_int.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/23 16:14:57 by chlpst            #+#    #+#             */
/*   Updated: 2025/09/25 17:38:41 by chlpst           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static void	ft_putnbr(int i, t_flags *flags)
{
	char	c;

	if (i >= 10)
		ft_putnbr(i / 10, flags);
	c = (i % 10) + '0';
	flags->fin_len += write(1, &c, 1);
}

void	ft_flags_adj(t_flags *flags, int len, int *zeros, int *spaces)
{
	if (flags->space == 1 && flags->sign == 1)
		flags->space = 0;
	if (flags->sign == 1)
		flags->fin_len += write(1, "+", 1);
	else if (flags->space == 1)
		flags->fin_len += write(1, " ", 1);
	if (flags->left_justified == 1)
		flags->zero_pad = 0;
	if (flags->width > len && flags->zero_pad)
		*zeros += flags->width - len;
	if (flags->dot == 1)
		flags->zero_pad = 0;
	if (flags->dot == 1 && flags->precision > len)
		*zeros += flags->precision - len;
	if (flags->sign || flags->space)
		*zeros -= 1;
	*spaces = flags->width - (len + *zeros);
	if (*spaces < 0)
		*spaces = 0;
	if (flags->left_justified == 0)
		while ((*spaces)-- > 0)
			flags->fin_len += write(1, " ", 1);
	if (flags->left_justified == 0)
		while ((*zeros)-- > 0)
			flags->fin_len += write(1, "0", 1);
}

static int	ft_handle_neg(int i, t_flags *flags)
{
	if (i == -2147483648)
	{
		flags->fin_len += write (1, "-2147483648", 11);
		return (-1);
	}
	if (i < 0)
	{
		flags->fin_len += write(1, "-", 1);
		flags->sign = 0;
		flags->space = 0;
		flags->precision += 1;
		i = -i;
	}
	return (i);
}

static int	ft_int_special(int i, t_flags *flags)
{
	if (i == 0 && flags->dot && flags->precision == 0)
	{
		while (flags->width-- > 0)
			flags->fin_len += write(1, " ", 1);
		return (1);
	}
	return (0);
}

void	ft_print_int(t_flags *flags)
{
	int	i;
	int	len;
	int	zeros;
	int	spaces;

	i = va_arg(flags->args, int);
	if (ft_int_special(i, flags))
		return ;
	zeros = 0;
	spaces = 0;
	len = ft_int_len(i);
	if (i < 0)
		i = ft_handle_neg(i, flags);
	if (i == -1)
		return ;
	ft_flags_adj(flags, len, &zeros, &spaces);
	ft_putnbr(i, flags);
	if (flags->left_justified == 1)
		while (spaces-- > 0)
			flags->fin_len += write(1, " ", 1);
}
