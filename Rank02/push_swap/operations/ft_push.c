/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_push.c                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/08 15:51:59 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/08 16:31:50 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

static void	ft_push(t_stack *dst, t_stack *src)
{
	t_node	*node;

	if (!src || !src->head)
		return ;
	node = src->head;
	src->head = src->head->next;
	if (src->head)
		src->head->prev = NULL;
	else
		src->tail = NULL;
	src->size--;
	node->next = dst->head;
	node->prev = NULL;
	if (dst->head)
		dst->head->prev = node;
	else
		dst->tail = node;
	dst->head = node;
	dst->size++;
}

void	ft_pa(t_stack *stack_a, t_stack *stack_b)
{
	ft_push(stack_a, stack_b);
	write (1, "pa\n", 3);
}

void	ft_pb(t_stack *stack_a, t_stack *stack_b)
{
	ft_push(stack_b, stack_a);
	write(1, "pb\n", 3);
}
