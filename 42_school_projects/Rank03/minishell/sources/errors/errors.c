/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   errors.c                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/11 16:44:01 by cpesty            #+#    #+#             */
/*   Updated: 2026/03/18 15:10:55 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

/* Prints malloc error message and sets exit status to 1. */
void	ft_malloc_error(int *exit_status)
{
	ft_putendl_fd("minishell: malloc failed", 2);
	*exit_status = 1;
}
