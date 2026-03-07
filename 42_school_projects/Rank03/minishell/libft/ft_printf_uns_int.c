/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_uns_int.c                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/23 16:14:57 by chlpst            #+#    #+#             */
/*   Updated: 2025/09/25 17:39:01 by chlpst           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static void	ft_putnbr_unsigned(unsigned int num, t_flags *flags)
{
	char	c;

	if (num >= 10)
		ft_putnbr_unsigned(num / 10, flags);
	c = (num % 10) + '0';
	flags->fin_len += write(1, &c, 1);
}

static void	ft_flags_adj_unsigned(t_flags *flags, int len,
		int *zeros, int *spaces)
{
	if (flags->left_justified == 1 || flags->dot == 1)
		flags->zero_pad = 0;
	if (flags->width > len && flags->zero_pad == 1 && flags->precision <= len)
		*zeros += flags->width - len;
	if (flags->dot == 1 && flags->precision > len)
		*zeros += flags->precision - len;
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

static int	ft_unsigned_int_special(unsigned int num, t_flags *flags)
{
	if (num == 0 && flags->dot && flags->precision == 0)
	{
		while (flags->width-- > 0)
			flags->fin_len += write(1, " ", 1);
		return (1);
	}
	return (0);
}

void	ft_print_unsigned_int(t_flags *flags)
{
	unsigned int	num;
	int				len;
	int				zeros;
	int				spaces;

	num = va_arg(flags->args, unsigned int);
	if (ft_unsigned_int_special(num, flags))
		return ;
	zeros = 0;
	spaces = 0;
	len = ft_unsigned_len(num);
	ft_flags_adj_unsigned (flags, len, &zeros, &spaces);
	ft_putnbr_unsigned(num, flags);
	if (flags->left_justified == 1)
		while (spaces-- > 0)
			flags->fin_len += write(1, " ", 1);
}
