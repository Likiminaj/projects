/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_pointer.c                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/18 16:57:09 by chlpst            #+#    #+#             */
/*   Updated: 2025/10/29 17:47:10 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static void	ft_print_pointer_body(char *address, t_flags *flags,
		t_hexa_param *add_param)
{
	if (!flags->left_justified)
		while (add_param->spaces-- > 0)
			flags->fin_len += write(1, " ", 1);
	flags->fin_len += write(1, "0x", 2);
	while (add_param->zero_pad-- > 0)
		flags->fin_len += write(1, "0", 1);
	flags->fin_len += write(1, address, add_param->hexa_len);
	if (flags->left_justified)
		while (add_param->spaces-- > 0)
			flags->fin_len += write(1, " ", 1);
}

static void	ft_pointer_flags(t_flags *flags, t_hexa_param *add_param)
{
	int	total_len;

	if (flags->dot && flags->precision == 0)
		add_param->hexa_len = 0;
	if (flags->dot && flags->precision > add_param->hexa_len)
		add_param->zero_pad = flags->precision - add_param->hexa_len;
	total_len = 2 + add_param->zero_pad + add_param->hexa_len;
	if (flags->width > total_len)
		add_param->spaces = flags->width - total_len;
	else
		add_param->spaces = 0;
}

static char	*ft_convert_to_hex(unsigned long ptr)
{
	char	*address;
	int		i;

	i = 0;
	address = ft_calloc_printf(17, 1);
	if (!address)
		return (NULL);
	if (ptr == 0)
	{
		address[i] = '0';
		address[i + 1] = '\0';
		return (address);
	}
	while (ptr && i < 16)
	{
		address[i] = "0123456789abcdef"[ptr % 16];
		ptr /= 16;
		i++;
	}
	address[i] = '\0';
	ft_str_reverse(address, i);
	return (address);
}

static int	ft_pointer_special(unsigned long ptr, t_flags *flags)
{
	if (!ptr)
	{
		flags->fin_len += write(1, "(nil)", 5);
		return (1);
	}
	if (ptr && flags->dot && flags->precision == 0)
	{
		flags->fin_len += write(1, "0x", 2);
		return (1);
	}
	return (0);
}

void	ft_print_pointer(t_flags *flags)
{
	unsigned long	ptr;
	char			*address;
	t_hexa_param	*add_param;

	add_param = malloc(sizeof(t_hexa_param));
	if (!add_param)
		return ;
	ft_hexa_param_initialization(add_param);
	ptr = va_arg(flags->args, unsigned long);
	if (ft_pointer_special(ptr, flags))
		return (free(add_param));
	address = ft_convert_to_hex(ptr);
	if (!address)
		return ;
	add_param->hexa_len = ft_strlen_printf(address);
	ft_pointer_flags(flags, add_param);
	ft_print_pointer_body(address, flags, add_param);
	free(address);
	free(add_param);
}
