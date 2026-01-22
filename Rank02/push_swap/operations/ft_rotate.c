/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_rotate.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/08 16:32:17 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/08 16:50:30 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

static void	ft_rotate(t_stack *stack)
{
	t_node	*top_node;

	if (!stack || !stack->head || !stack->head->next)
		return ;
	top_node = stack->head;
	stack->head = top_node->next;
	stack->head->prev = NULL;
	top_node->next = NULL;
	top_node->prev = stack->tail;
	stack->tail->next = top_node;
	stack->tail = top_node;
}

void	ft_ra(t_stack *stack_a)
{
	ft_rotate(stack_a);
	write(1, "ra\n", 3);
}

void	ft_rb(t_stack *stack_b)
{
	ft_rotate(stack_b);
	write(1, "rb\n", 3);
}

void	ft_rr(t_stack *stack_a, t_stack *stack_b)
{
	ft_rotate(stack_a);
	ft_rotate(stack_b);
	write(1, "rr\n", 3);
}
