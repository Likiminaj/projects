/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf_utils_2.c                                :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpst <chlpst@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/18 15:21:34 by chlpst            #+#    #+#             */
/*   Updated: 2025/09/25 17:39:04 by chlpst           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

t_hexa_param	*ft_hexa_param_initialization(t_hexa_param *hexa_param)
{
	hexa_param->hexa_len = 0;
	hexa_param->zero_pad = 0;
	hexa_param->spaces = 0;
	return (hexa_param);
}

int	ft_unsigned_len(unsigned int num)
{
	int	len;

	if (num == 0)
		return (1);
	len = 0;
	while (num > 0)
	{
		num /= 10;
		len++;
	}
	return (len);
}

int	ft_atoi_printf(const char **format)
{
	int	final;

	final = 0;
	while (**format >= '0' && **format <= '9')
	{
		final = final * 10 + (**format - '0');
		(*format)++;
	}
	return (final);
}
