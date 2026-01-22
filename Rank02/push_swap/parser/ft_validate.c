/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_validate.c                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:59:00 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/08 13:01:22 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "../push_swap.h"

static size_t	ft_check_argv(char *str);
static size_t	ft_valid_token(char *str, size_t word_start, size_t word_end);

size_t	ft_word_count_and_process(int argc, char **argv)
{
	size_t	i;
	size_t	local_count;
	size_t	total_count;

	i = 1;
	total_count = 0;
	while (i < (size_t)argc)
	{
		local_count = ft_check_argv(argv[i]);
		if (!local_count)
			return (0);
		total_count += local_count;
		i++;
	}
	return (total_count);
}

static size_t	ft_check_argv(char *str)
{
	size_t	i;
	size_t	word_count;
	size_t	word_start;

	i = 0;
	word_count = 0;
	while (str[i])
	{
		while (str[i] && ft_space(str[i]))
			i++;
		if (str[i] && !ft_space(str[i]))
		{
			word_count++;
			word_start = i;
			while (str[i] && !ft_space(str[i]))
				i++;
			if (!ft_valid_token(str, word_start, i))
				return (0);
		}
	}
	return (word_count);
}

static size_t	ft_valid_token(char *str, size_t word_start, size_t word_end)
{
	size_t	i;

	i = word_start;
	if (str[i] == '-' || str[i] == '+')
	{
		i++;
		if (!str[i] || !(str[i] >= '0' && str[i] <= '9'))
			return (0);
	}
	while (i < word_end && str[i])
	{
		if (str[i] < '0' || str[i] > '9')
			return (0);
		i++;
	}
	return (1);
}

size_t	ft_dup(t_stack *stack)
{
	t_node	*current;
	t_node	*compare;

	if (!stack || !stack->head)
		return (0);
	current = stack->head;
	while (current)
	{
		compare = current->next;
		while (compare)
		{
			if (current->number == compare->number)
				return (1);
			compare = compare->next;
		}
		current = current->next;
	}
	return (0);
}

size_t	ft_assign_rank(t_stack *stack)
{
	t_node	*current;
	t_node	*compare;
	size_t	rank;

	if (!stack || !stack->head)
		return (0);
	current = stack->head;
	while (current)
	{
		rank = 0;
		compare = stack->head;
		while (compare)
		{
			if (compare->number < current->number)
				rank++;
			compare = compare->next;
		}
		current->rank = rank;
		current = current->next;
	}
	return (1);
}
