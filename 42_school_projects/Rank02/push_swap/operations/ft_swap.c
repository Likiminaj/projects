/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_swap.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/08 14:06:10 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/08 15:58:27 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

static void	ft_swap(t_stack *stack)
{
	int	tmp_number;
	int	tmp_rank;

	if (!stack || !stack->head || !stack->head->next)
		return ;
	tmp_number = stack->head->number;
	tmp_rank = stack->head->rank;
	stack->head->number = stack->head->next->number;
	stack->head->rank = stack->head->next->rank;
	stack->head->next->number = tmp_number;
	stack->head->next->rank = tmp_rank;
}

void	ft_sa(t_stack *stack_a)
{
	ft_swap(stack_a);
	write(1, "sa\n", 3);
}

void	ft_sb(t_stack *stack_b)
{
	ft_swap(stack_b);
	write(1, "sb\n", 3);
}

void	ft_ss(t_stack *stack_a, t_stack *stack_b)
{
	ft_swap(stack_a);
	ft_swap(stack_b);
	write(1, "ss\n", 3);
}
