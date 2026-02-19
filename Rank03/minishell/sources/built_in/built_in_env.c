/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_env.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/18 17:01:42 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/17 15:00:23 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int	builtin_env(t_ast *ast, t_env *env);

/* Prints all environement variables in the format VAR=CONTENT.*/
int	builtin_env(t_ast *ast, t_env *env)
{
	int	i;

	(void)ast;
	i = 0;
	while (env->envp[i] != NULL)
	{
		if (ft_strchr(env->envp[i], '=') != NULL)
			ft_printf("%s\n", env->envp[i]);
		i++;
	}
	return (0);
}
