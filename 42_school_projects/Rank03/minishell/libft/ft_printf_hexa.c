/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_hexa.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/24 13:59:24 by chlpst            #+#    #+#             */
/*   Updated: 2025/10/29 17:47:03 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static void	ft_print_hexa_body(char *fin_hexa, t_flags *flags,
		t_hexa_param *hexa_param)
{
	if (!flags->left_justified)
		while (hexa_param->spaces-- > 0)
			flags->fin_len += write(1, " ", 1);
	if (flags->hash)
	{
		if (flags->specifier == 'x')
			flags->fin_len += write(1, "0x", 2);
		else if (flags->specifier == 'X')
			flags->fin_len += write(1, "0X", 2);
	}
	while (hexa_param->zero_pad-- > 0)
		flags->fin_len += write(1, "0", 1);
	flags->fin_len += write(1, fin_hexa, hexa_param->hexa_len);
	if (flags->left_justified)
		while (hexa_param->spaces-- > 0)
			flags->fin_len += write(1, " ", 1);
}

static char	*ft_hexa_conversion_upper(unsigned int hexa)
{
	char	*fin_hexa;
	int		i;

	i = 0;
	fin_hexa = ft_calloc_printf(17, 1);
	if (!fin_hexa)
		return (NULL);
	if (hexa == 0)
	{
		fin_hexa[i] = '0';
		fin_hexa[i + 1] = '\0';
		return (fin_hexa);
	}
	while (hexa && i < 16)
	{
		fin_hexa[i] = "0123456789ABCDEF"[hexa % 16];
		hexa /= 16;
		i++;
	}
	fin_hexa[i] = '\0';
	ft_str_reverse(fin_hexa, i);
	return (fin_hexa);
}

static char	*ft_hexa_conversion_lower(unsigned int hexa)
{
	char	*fin_hexa;
	int		i;

	i = 0;
	fin_hexa = ft_calloc_printf(17, 1);
	if (!fin_hexa)
		return (NULL);
	if (hexa == 0)
	{
		fin_hexa[i] = '0';
		fin_hexa[i + 1] = '\0';
		return (fin_hexa);
	}
	while (hexa && i < 16)
	{
		fin_hexa[i] = "0123456789abcdef"[hexa % 16];
		hexa /= 16;
		i++;
	}
	fin_hexa[i] = '\0';
	ft_str_reverse(fin_hexa, i);
	return (fin_hexa);
}

static int	ft_hexa_special(unsigned int hexa, t_flags *flags,
		t_hexa_param *hexa_param)
{
	int	total_len;

	if (flags->dot && flags->precision == 0 && hexa == 0)
	{
		while (flags->width-- > 0)
			flags->fin_len += write(1, " ", 1);
		return (free(hexa_param), 1);
	}
	if (flags->zero_pad && (flags->dot || flags->left_justified))
		flags->zero_pad = 0;
	if (flags->dot && flags->precision > hexa_param->hexa_len)
		hexa_param->zero_pad = flags->precision - hexa_param->hexa_len;
	if (flags->zero_pad && flags->width > hexa_param->hexa_len)
		hexa_param->zero_pad = flags->width - hexa_param->hexa_len;
	if (hexa == 0)
		flags->hash = 0;
	if (flags->hash == 1)
		total_len = 2 + hexa_param->zero_pad + hexa_param->hexa_len;
	else
		total_len = hexa_param->zero_pad + hexa_param->hexa_len;
	if (flags->width > total_len)
		hexa_param->spaces = flags->width - total_len;
	else
		hexa_param->spaces = 0;
	return (0);
}

void	ft_print_hexa(t_flags *flags)
{
	unsigned int	hexa;
	char			*fin_hexa;
	t_hexa_param	*hexa_param;

	hexa_param = malloc(sizeof(t_hexa_param));
	if (!hexa_param)
		return ;
	ft_hexa_param_initialization(hexa_param);
	hexa = va_arg(flags->args, unsigned int);
	if (flags->specifier == 'x')
		fin_hexa = ft_hexa_conversion_lower(hexa);
	else
		fin_hexa = ft_hexa_conversion_upper(hexa);
	if (!fin_hexa)
		return (free(hexa_param));
	hexa_param->hexa_len = ft_strlen_printf(fin_hexa);
	if (ft_hexa_special(hexa, flags, hexa_param))
		return (free(fin_hexa));
	ft_print_hexa_body(fin_hexa, flags, hexa_param);
	return (free(fin_hexa), free(hexa_param));
}
