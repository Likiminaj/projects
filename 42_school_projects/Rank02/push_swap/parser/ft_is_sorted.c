/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_is_sorted.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:59:00 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/08 13:01:22 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

size_t	ft_is_sorted(t_stack *stack)
{
	t_node	*current;
	t_node	*compare;

	if (!stack || !stack->head || stack->size <= 1)
		return (1);
	current = stack->head;
	compare = stack->head->next;
	while (compare)
	{
		if (current->rank > compare->rank)
			return (0);
		current = compare;
		compare = compare->next;
	}
	return (1);
}
