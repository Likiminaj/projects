/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_tolower.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/28 12:21:46 by cpesty            #+#    #+#             */
/*   Updated: 2025/05/28 14:55:49 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// DESCRIPTION
// These functions convert lowercase letters to uppercase, and vice versa.
// RETURN VALUE
//  The value returned is that of the converted letter, or c if  the  conversion
//  was not possible.

#include "libft.h"

int	ft_tolower(int c)
{
	if ((c >= 'A' && c <= 'Z'))
		return (c + 32);
	else
		return (c);
}
