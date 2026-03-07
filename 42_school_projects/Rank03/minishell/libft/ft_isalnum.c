/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_isalnum.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/28 11:31:58 by cpesty            #+#    #+#             */
/*   Updated: 2025/05/28 14:55:13 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// isalnum()
// checks for an alphanumeric character; it is equivalent to (isal‐
// pha(c) || isdigit(c)).
// The values returned are nonzero if the character c  falls  into  the  tested
// class, and zero if not.

#include "libft.h"

int	ft_isalnum(int c)
{
	return (((c >= '0' && c <= '9')
			|| (c >= 'A' && c <= 'Z')
			|| (c >= 'a' && c <= 'z' )));
}
