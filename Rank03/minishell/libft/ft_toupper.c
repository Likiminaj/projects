/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_toupper.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/28 12:21:46 by cpesty            #+#    #+#             */
/*   Updated: 2025/05/28 14:55:52 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// DESCRIPTION
// These functions convert lowercase letters to uppercase, and vice versa.
// RETURN VALUE
//  The value returned is that of the converted letter, or c if  the  conversion
//  was not possible.

#include "libft.h"

int	ft_toupper(int c)
{
	if ((c >= 'a' && c <= 'z'))
		return (c - 32);
	else
		return (c);
}
