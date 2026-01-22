/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   push_swap.h                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:03:56 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/19 12:30:28 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#ifndef PUSH_SWAP_H
# define PUSH_SWAP_H

// include(s)
# include <stdlib.h>
# include <unistd.h>
# include <limits.h>
# include <stddef.h>

// struct(s)
typedef struct s_node
{
	int				number;
	int				rank;
	struct s_node	*next;
	struct s_node	*prev;
}		t_node;

typedef struct s_stack
{
	size_t	size;
	t_node	*head;
	t_node	*tail;
}		t_stack;

// prototype(s)
void	ft_print_error(void);
void	ft_free(t_stack **stack);
void	ft_fail(t_stack **stack);
void	ft_sa(t_stack *stack_a);
void	ft_sb(t_stack *stack_b);
void	ft_ss(t_stack *stack_a, t_stack *stack_b);
void	ft_pa(t_stack *stack_a, t_stack *stack_b);
void	ft_pb(t_stack *stack_a, t_stack *stack_b);
void	ft_ra(t_stack *stack_a);
void	ft_rb(t_stack *stack_b);
void	ft_rr(t_stack *stack_a, t_stack *stack_b);
void	ft_rra(t_stack *stack_a);
void	ft_rrb(t_stack *stack_b);
void	ft_rrr(t_stack *stack_a, t_stack *stack_b);
void	ft_sort_large(t_stack *a, t_stack *b);
void	ft_sort_small(t_stack *a, t_stack *b);
void	ft_sort_stack(t_stack *a, t_stack *b);
void	ft_sort_three(t_stack *a);
size_t	ft_is_sorted(t_stack *stack);
size_t	ft_space(int c);
size_t	ft_dup(t_stack *stack);
size_t	ft_assign_rank(t_stack *stack);
size_t	ft_word_count_and_process(int argc, char **argv);
t_node	*ft_last_node(t_node *head);
t_stack	*ft_build_stack(int argc, char **argv);

#endif
