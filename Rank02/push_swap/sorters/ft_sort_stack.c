/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_push.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/08 15:51:59 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/08 16:31:50 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

void	ft_sort_stack(t_stack *stack_a, t_stack *stack_b)
{
	if (!stack_a || stack_a->size <= 1)
		return ;
	if (stack_a->size == 2)
		ft_sa(stack_a);
	else if (stack_a->size == 3)
		ft_sort_three(stack_a);
	else if (stack_a->size <= 5)
		ft_sort_small(stack_a, stack_b);
	else
		ft_sort_large(stack_a, stack_b);
}
